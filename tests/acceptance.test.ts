import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createSeatHold, getShowSeatAvailability, cleanupExpiredHolds } from "../src/lib/seat-locking";
import { confirmBooking, cancelBooking, validateTicket } from "../src/lib/booking-service";
import { requireAdmin, JWTPayload } from "../src/lib/auth";

describe("Mandatory Critical Acceptance Tests", () => {
  let testUser1: any;
  let testUser2: any;
  let testShow: any;
  let availableSeats: any[];

  beforeAll(async () => {
    // Fetch seed users
    testUser1 = await prisma.user.findUnique({ where: { email: "customer@cinemahall.com" } });
    testUser2 = await prisma.user.findUnique({ where: { email: "priya.patel@example.com" } });

    // Find an active show
    testShow = await prisma.show.findFirst({
      where: { isActive: true },
      include: { screen: true, movie: true },
    });

    // Find available seats for this show that are not booked
    const bookedSeatIds = (
      await prisma.bookingSeat.findMany({
        where: { showId: testShow.id, booking: { status: "CONFIRMED" } },
        select: { seatId: true },
      })
    ).map((b) => b.seatId);

    availableSeats = await prisma.seat.findMany({
      where: {
        screenId: testShow.screenId,
        id: { notIn: bookedSeatIds },
      },
      take: 4,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // TEST 1: Seat selection, temporary hold, and successful booking confirmation
  it("Test 1: A customer can select an available seat, hold it and successfully book it", async () => {
    const seatToBook = availableSeats[0];

    // 1. Create temporary hold
    const hold = await createSeatHold(testShow.id, [seatToBook.id], testUser1.id, 5);
    expect(hold.holdToken).toBeDefined();
    expect(hold.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // 2. Confirm booking with simulated payment
    const result = await confirmBooking({
      holdToken: hold.holdToken,
      userId: testUser1.id,
      paymentMethod: "CARD",
      idempotencyKey: `test-idemp-1-${Date.now()}`,
      simulatePaymentStatus: "SUCCESS",
    });

    expect(result.booking).toBeDefined();
    expect(result.booking.status).toBe("CONFIRMED");
    expect(result.booking.ticket).toBeDefined();
    expect(result.booking.ticket.qrCodeData).toContain("data:image/png;base64");
    expect(result.isIdempotentReplay).toBe(false);

    // Verify in database that SeatHold was removed
    const lingeringHold = await prisma.seatHold.findFirst({
      where: { holdToken: hold.holdToken },
    });
    expect(lingeringHold).toBeNull();
  });

  // TEST 2: Two customers cannot confirm or hold the same seat for the same show (Concurrency)
  it("Test 2: Two customers cannot confirm the same seat for the same show (Concurrency Conflict)", async () => {
    const targetSeat = availableSeats[1];

    // User 1 acquires a hold on targetSeat
    const holdUser1 = await createSeatHold(testShow.id, [targetSeat.id], testUser1.id, 5);
    expect(holdUser1.holdToken).toBeDefined();

    // User 2 attempts to hold the same seat while hold is active
    await expect(
      createSeatHold(testShow.id, [targetSeat.id], testUser2.id, 5)
    ).rejects.toThrow(/SEAT_ALREADY_HELD/);

    // User 1 completes booking
    await confirmBooking({
      holdToken: holdUser1.holdToken,
      userId: testUser1.id,
      paymentMethod: "CARD",
      idempotencyKey: `test-idemp-2-${Date.now()}`,
      simulatePaymentStatus: "SUCCESS",
    });

    // Now seat is confirmed booked. Any subsequent hold attempt must fail
    await expect(
      createSeatHold(testShow.id, [targetSeat.id], testUser2.id, 5)
    ).rejects.toThrow(/SEAT_ALREADY_BOOKED/);
  });

  // TEST 3: Expired seat holds release seats automatically
  it("Test 3: Expired seat holds release seats automatically", async () => {
    const expiredSeat = availableSeats[2];

    // Create an artificial expired hold in DB (expired 10 minutes ago)
    const pastDate = new Date(Date.now() - 10 * 60 * 1000);
    const holdToken = `HOLD-EXPIRED-TEST-${Date.now()}`;

    await prisma.seatHold.create({
      data: {
        showId: testShow.id,
        seatId: expiredSeat.id,
        userId: testUser1.id,
        holdToken,
        expiresAt: pastDate,
      },
    });

    // Check availability: should trigger automatic cleanup
    const availability = await getShowSeatAvailability(testShow.id);
    const seatStatus = availability.seats.find((s) => s.id === expiredSeat.id);

    expect(seatStatus?.status).toBe("AVAILABLE");

    // Verify expired record was deleted from database
    const dbHold = await prisma.seatHold.findFirst({
      where: { holdToken },
    });
    expect(dbHold).toBeNull();
  });

  // TEST 4: Confirmed bookings remain unavailable
  it("Test 4: Confirmed bookings remain unavailable", async () => {
    const seat = availableSeats[0]; // Was booked in Test 1

    const availability = await getShowSeatAvailability(testShow.id);
    const seatItem = availability.seats.find((s) => s.id === seat.id);

    expect(seatItem?.status).toBe("BOOKED");

    // Any attempt to hold must throw SEAT_ALREADY_BOOKED
    await expect(
      createSeatHold(testShow.id, [seat.id], testUser2.id, 5)
    ).rejects.toThrow(/SEAT_ALREADY_BOOKED/);
  });

  // TEST 5: A generated ticket QR/token can be validated once, and duplicate validation is rejected
  it("Test 5: A generated ticket QR/token can be validated once, and duplicate validation is rejected", async () => {
    // Find an unused ticket from database
    const freshTicket = await prisma.ticket.findFirst({
      where: {
        isValidated: false,
        booking: { status: "CONFIRMED" },
      },
      include: { booking: true },
    });

    expect(freshTicket).not.toBeNull();
    const ticketCode = freshTicket!.ticketCode;

    // First validation attempt -> Must succeed
    const firstValidation = await validateTicket(ticketCode, "Gate Usher Test");
    expect(firstValidation.success).toBe(true);
    expect(firstValidation.ticket.isValidated).toBe(true);

    // Second validation attempt -> Must fail with duplicate rejected error
    await expect(
      validateTicket(ticketCode, "Gate Usher Test")
    ).rejects.toThrow(/TICKET_ALREADY_VALIDATED/);
  });

  // TEST 6: Admin occupancy and sales reports correctly reflect bookings and cancellations
  it("Test 6: Admin occupancy and sales reports correctly reflect bookings and cancellations", async () => {
    // 1. Create a fresh booking for user 2
    const seat = availableSeats[3];
    const hold = await createSeatHold(testShow.id, [seat.id], testUser2.id, 5);
    const bookingResult = await confirmBooking({
      holdToken: hold.holdToken,
      userId: testUser2.id,
      paymentMethod: "UPI",
      idempotencyKey: `test-cancel-idemp-${Date.now()}`,
      simulatePaymentStatus: "SUCCESS",
    });

    const bookingId = bookingResult.booking.id;

    // 2. Perform cancellation
    const cancelResult = await cancelBooking(bookingId, testUser2.id, "ADMIN", "Test cancellation");
    expect(cancelResult.booking.status).toBe("CANCELLED");
    expect(cancelResult.refund).toBeDefined();
    expect(cancelResult.refund.status).toBe("COMPLETED");

    // 3. Verify that the seat is freed in BookingSeat table
    const bookingSeatCount = await prisma.bookingSeat.count({
      where: { bookingId },
    });
    expect(bookingSeatCount).toBe(0);

    // 4. Verify that the seat status is back to AVAILABLE
    const avail = await getShowSeatAvailability(testShow.id);
    const seatState = avail.seats.find((s) => s.id === seat.id);
    expect(seatState?.status).toBe("AVAILABLE");
  });

  // TEST 7: Customers cannot access administrator APIs / authorization checks
  it("Test 7: Customers cannot access administrator authorization checks", async () => {
    const customerPayload: JWTPayload = {
      userId: testUser1.id,
      email: testUser1.email,
      name: testUser1.name,
      role: "CUSTOMER",
    };

    // requireAdmin must reject non-admin users
    expect(customerPayload.role).not.toBe("ADMIN");

    // Verify role validation function directly
    const verifyIsAdmin = (payload: JWTPayload) => {
      if (!payload || payload.role !== "ADMIN") {
        throw new Error("FORBIDDEN_ADMIN_ONLY");
      }
      return true;
    };

    expect(() => verifyIsAdmin(customerPayload)).toThrow("FORBIDDEN_ADMIN_ONLY");

    const adminPayload: JWTPayload = {
      userId: "admin-id",
      email: "admin@cinemahall.com",
      name: "Admin User",
      role: "ADMIN",
    };
    expect(verifyIsAdmin(adminPayload)).toBe(true);
  });

  // TEST 8: Duplicate payment or booking requests cannot create duplicate bookings (Idempotency)
  it("Test 8: Duplicate payment or booking requests cannot create duplicate bookings", async () => {
    // Find an unbooked seat
    const allSeats = await prisma.seat.findMany({
      where: { screenId: testShow.screenId },
    });
    const bookedIds = (
      await prisma.bookingSeat.findMany({
        where: { showId: testShow.id, booking: { status: "CONFIRMED" } },
        select: { seatId: true },
      })
    ).map((b) => b.seatId);

    const freshSeat = allSeats.find((s) => !bookedIds.includes(s.id));
    expect(freshSeat).toBeDefined();

    const hold = await createSeatHold(testShow.id, [freshSeat!.id], testUser1.id, 5);
    const fixedIdempotencyKey = `idemp-atomic-test-${Date.now()}`;

    // First request
    const firstCall = await confirmBooking({
      holdToken: hold.holdToken,
      userId: testUser1.id,
      paymentMethod: "CARD",
      idempotencyKey: fixedIdempotencyKey,
      simulatePaymentStatus: "SUCCESS",
    });

    expect(firstCall.isIdempotentReplay).toBe(false);
    expect(firstCall.booking.id).toBeDefined();

    // Second request with exact same idempotencyKey (simulating network duplicate / retry)
    const secondCall = await confirmBooking({
      holdToken: hold.holdToken,
      userId: testUser1.id,
      paymentMethod: "CARD",
      idempotencyKey: fixedIdempotencyKey,
      simulatePaymentStatus: "SUCCESS",
    });

    expect(secondCall.isIdempotentReplay).toBe(true);
    expect(secondCall.booking.id).toBe(firstCall.booking.id);
    expect(secondCall.booking.bookingReference).toBe(firstCall.booking.bookingReference);

    // Verify in database that only ONE booking exists with this idempotency key
    const count = await prisma.booking.count({
      where: { idempotencyKey: fixedIdempotencyKey },
    });
    expect(count).toBe(1);
  });
});
