import { prisma } from "./prisma";
import { cleanupExpiredHolds } from "./seat-locking";
import QRCode from "qrcode";
import crypto from "crypto";

export interface CreateBookingParams {
  holdToken: string;
  userId: string;
  paymentMethod: "CARD" | "UPI" | "NET_BANKING" | "SIMULATED";
  idempotencyKey?: string;
  simulatePaymentStatus?: "SUCCESS" | "FAILED" | "CANCELLED";
}

export async function confirmBooking(params: CreateBookingParams) {
  const {
    holdToken,
    userId,
    paymentMethod = "CARD",
    idempotencyKey,
    simulatePaymentStatus = "SUCCESS",
  } = params;

  // 1. Idempotency Check: prevent duplicate charges / duplicate bookings
  if (idempotencyKey) {
    const existingBooking = await prisma.booking.findUnique({
      where: { idempotencyKey },
      include: {
        seats: { include: { seat: { include: { category: true } } } },
        show: { include: { movie: true, screen: { include: { theatre: true } } } },
        payment: true,
        ticket: true,
      },
    });

    if (existingBooking) {
      return {
        booking: existingBooking,
        isIdempotentReplay: true,
      };
    }
  }

  // 2. Validate Seat Holds
  await cleanupExpiredHolds();

  const holds = await prisma.seatHold.findMany({
    where: {
      holdToken,
      userId,
      expiresAt: { gt: new Date() },
    },
    include: {
      seat: { include: { category: true } },
      show: { include: { movie: true, screen: { include: { theatre: true } } } },
    },
  });

  if (!holds || holds.length === 0) {
    throw new Error("HOLD_EXPIRED_OR_INVALID: Your seat reservation has expired. Please select seats again.");
  }

  const show = holds[0].show;
  const showId = show.id;
  const seatIds = holds.map((h) => h.seatId);

  // Calculate pricing
  let seatsSubtotal = 0;
  const seatPriceList: { seatId: string; price: number; label: string }[] = [];

  for (const h of holds) {
    let price = show.silverPrice;
    if (h.seat.category.code === "GOLD") price = show.goldPrice;
    if (h.seat.category.code === "PREMIUM") price = show.premiumPrice;

    seatsSubtotal += price;
    seatPriceList.push({
      seatId: h.seatId,
      price,
      label: `${h.seat.row}${h.seat.number} (${h.seat.category.name})`,
    });
  }

  const convenienceFee = Math.round(seatsSubtotal * 0.08); // 8% convenience fee
  const taxAmount = Math.round((seatsSubtotal + convenienceFee) * 0.05); // 5% GST
  const totalAmount = seatsSubtotal + convenienceFee + taxAmount;

  // 3. Handle Payment Simulation Failures
  if (simulatePaymentStatus === "FAILED") {
    // Audit failed attempt
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PAYMENT_FAILED_SIMULATION",
        entityType: "Payment",
        details: JSON.stringify({ showId, seatIds, totalAmount }),
      },
    });
    throw new Error("PAYMENT_FAILED: Simulated payment transaction declined by bank.");
  }

  if (simulatePaymentStatus === "CANCELLED") {
    // Release hold on user cancellation
    await prisma.seatHold.deleteMany({ where: { holdToken } });
    throw new Error("PAYMENT_CANCELLED: User cancelled the payment transaction.");
  }

  // 4. Atomic Booking Confirmation Transaction
  const bookingReference = `CINE-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const transactionRef = `TXN-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const ticketCode = `TKT-${new Date().getFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const result = await prisma.$transaction(async (tx) => {
    // Double check that no other user has confirmed these seats
    const existingConfirmed = await tx.bookingSeat.findFirst({
      where: {
        showId,
        seatId: { in: seatIds },
        booking: { status: "CONFIRMED" },
      },
      include: { seat: true },
    });

    if (existingConfirmed) {
      throw new Error(`CONCURRENCY_CONFLICT: Seat ${existingConfirmed.seat.row}${existingConfirmed.seat.number} was just booked by another user.`);
    }

    // Create Booking
    const newBooking = await tx.booking.create({
      data: {
        bookingReference,
        userId,
        showId,
        totalAmount,
        convenienceFee,
        taxAmount,
        status: "CONFIRMED",
        idempotencyKey: idempotencyKey || null,
      },
    });

    // Create Booking Seats (Unique constraint @@unique([showId, seatId]) enforces no duplicate bookings at DB level!)
    for (const item of seatPriceList) {
      await tx.bookingSeat.create({
        data: {
          bookingId: newBooking.id,
          seatId: item.seatId,
          showId,
          price: item.price,
        },
      });
    }

    // Create Payment record
    const payment = await tx.payment.create({
      data: {
        bookingId: newBooking.id,
        amount: totalAmount,
        paymentMethod,
        status: "SUCCESS",
        transactionReference: transactionRef,
      },
    });

    // Generate QR Code data payload
    const qrPayload = JSON.stringify({
      ref: bookingReference,
      ticket: ticketCode,
      showId,
      movie: show.movie.title,
      seats: seatPriceList.map((s) => s.label),
      amount: totalAmount,
      bookedAt: new Date().toISOString(),
    });

    const qrCodeData = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 256,
      color: {
        dark: "#1E1B4B",
        light: "#FFFFFF",
      },
    });

    // Create Ticket record
    const ticket = await tx.ticket.create({
      data: {
        bookingId: newBooking.id,
        ticketCode,
        qrCodeData,
        isValidated: false,
      },
    });

    // Remove the temporary seat holds
    await tx.seatHold.deleteMany({
      where: { holdToken },
    });

    // Log in Audit Trail
    await tx.auditLog.create({
      data: {
        userId,
        action: "BOOKING_CREATED",
        entityType: "Booking",
        entityId: newBooking.id,
        details: JSON.stringify({
          bookingReference,
          movie: show.movie.title,
          totalAmount,
          seatCount: seatIds.length,
        }),
      },
    });

    return {
      ...newBooking,
      payment,
      ticket,
      show,
    };
  });

  return {
    booking: result,
    isIdempotentReplay: false,
  };
}

export async function cancelBooking(bookingId: string, userId: string, userRole: string, reason: string = "User requested cancellation") {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      show: { include: { movie: true } },
      seats: true,
      payment: true,
      cancellation: true,
    },
  });

  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  // Authorization check
  if (booking.userId !== userId && userRole !== "ADMIN") {
    throw new Error("FORBIDDEN: You do not have permission to cancel this booking.");
  }

  if (booking.status === "CANCELLED") {
    throw new Error("BOOKING_ALREADY_CANCELLED");
  }

  // Business Rule: Cancellations allowed up to 2 hours before showtime
  const now = new Date();
  const showTime = new Date(booking.show.startTime);
  const diffHours = (showTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 2 && userRole !== "ADMIN") {
    throw new Error("CANCELLATION_WINDOW_CLOSED: Cancellations are only permitted up to 2 hours prior to showtime.");
  }

  // 10% cancellation fee, 90% refund
  const cancellationFee = Math.round(booking.totalAmount * 0.1);
  const refundAmount = booking.totalAmount - cancellationFee;
  const refundTxn = `REF-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  return await prisma.$transaction(async (tx) => {
    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    // Remove BookingSeat records so the seats become available again for other customers
    await tx.bookingSeat.deleteMany({
      where: { bookingId },
    });

    // Create Cancellation record
    const cancellation = await tx.cancellation.create({
      data: {
        bookingId,
        reason,
        refundAmount,
        cancellationFee,
        status: "PROCESSED",
      },
    });

    // Create Refund record
    const refund = await tx.refund.create({
      data: {
        cancellationId: cancellation.id,
        amount: refundAmount,
        status: "COMPLETED",
        transactionReference: refundTxn,
      },
    });

    // Update payment record status
    if (booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: "REFUNDED" },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: "BOOKING_CANCELLED",
        entityType: "Booking",
        entityId: bookingId,
        details: JSON.stringify({
          bookingReference: booking.bookingReference,
          refundAmount,
          cancellationFee,
        }),
      },
    });

    return {
      booking: updatedBooking,
      cancellation,
      refund,
    };
  });
}

export async function validateTicket(ticketCodeOrQr: string, usherName: string = "Gate Validator") {
  // Can be a ticket code directly or JSON QR string
  let searchCode = ticketCodeOrQr.trim();
  try {
    const parsed = JSON.parse(ticketCodeOrQr);
    if (parsed.ticket) searchCode = parsed.ticket;
    else if (parsed.ref) {
      const byRef = await prisma.ticket.findFirst({
        where: { booking: { bookingReference: parsed.ref } },
        include: {
          booking: {
            include: {
              user: true,
              show: { include: { movie: true, screen: { include: { theatre: true } } } },
              seats: { include: { seat: true } },
            },
          },
        },
      });
      if (byRef) searchCode = byRef.ticketCode;
    }
  } catch (e) {
    // String ticket code
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      OR: [
        { ticketCode: searchCode },
        { booking: { bookingReference: searchCode } },
      ],
    },
    include: {
      booking: {
        include: {
          user: true,
          show: { include: { movie: true, screen: { include: { theatre: true } } } },
          seats: { include: { seat: { include: { category: true } } } },
        },
      },
    },
  });

  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND: No ticket found matching the provided code or QR token.");
  }

  if (ticket.booking.status === "CANCELLED") {
    throw new Error("TICKET_CANCELLED: This booking has been cancelled and refunded. Entry denied.");
  }

  // Critical Acceptance Test 5 requirement: Single validation only!
  if (ticket.isValidated) {
    throw new Error(
      `TICKET_ALREADY_VALIDATED: This ticket was already validated on ${ticket.validatedAt?.toLocaleString()} by ${ticket.validatedBy || "Staff"}. Duplicate entry rejected.`
    );
  }

  const validatedAt = new Date();
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      isValidated: true,
      validatedAt,
      validatedBy: usherName,
    },
  });

  // Log in Audit Trail
  await prisma.auditLog.create({
    data: {
      userId: null,
      action: "TICKET_VALIDATED",
      entityType: "Ticket",
      entityId: ticket.id,
      details: JSON.stringify({
        ticketCode: ticket.ticketCode,
        bookingRef: ticket.booking.bookingReference,
        movie: ticket.booking.show.movie.title,
        usher: usherName,
        validatedAt,
      }),
    },
  });

  return {
    success: true,
    ticket: updatedTicket,
    booking: ticket.booking,
  };
}
