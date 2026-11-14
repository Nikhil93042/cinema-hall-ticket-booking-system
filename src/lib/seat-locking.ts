import { prisma } from "./prisma";
import crypto from "crypto";

export interface SeatStatusItem {
  id: string;
  row: string;
  number: number;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  price: number;
  status: "AVAILABLE" | "HELD" | "BOOKED";
  heldByCurrentUser?: boolean;
}

export async function cleanupExpiredHolds(): Promise<number> {
  const result = await prisma.seatHold.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}

export async function getShowSeatAvailability(
  showId: string,
  currentUserId?: string
): Promise<{
  show: any;
  seats: SeatStatusItem[];
  summary: { total: number; available: number; held: number; booked: number };
}> {
  // 1. Purge expired holds first
  await cleanupExpiredHolds();

  // 2. Fetch show with screen details
  const show = await prisma.show.findUnique({
    where: { id: showId },
    include: {
      movie: true,
      screen: {
        include: {
          theatre: true,
        },
      },
    },
  });

  if (!show) {
    throw new Error("SHOW_NOT_FOUND");
  }

  // 3. Fetch all seats for the screen with categories
  const allSeats = await prisma.seat.findMany({
    where: {
      screenId: show.screenId,
      isActive: true,
    },
    include: {
      category: true,
    },
    orderBy: [{ row: "asc" }, { number: "asc" }],
  });

  // 4. Fetch confirmed booking seats for this show
  const bookedSeats = await prisma.bookingSeat.findMany({
    where: {
      showId: show.id,
      booking: {
        status: "CONFIRMED",
      },
    },
    select: {
      seatId: true,
    },
  });
  const bookedSeatIdSet = new Set(bookedSeats.map((b) => b.seatId));

  // 5. Fetch active holds for this show
  const activeHolds = await prisma.seatHold.findMany({
    where: {
      showId: show.id,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      seatId: true,
      userId: true,
      expiresAt: true,
    },
  });

  const activeHoldMap = new Map(activeHolds.map((h) => [h.seatId, h]));

  // 6. Map each seat to status & price
  let availableCount = 0;
  let heldCount = 0;
  let bookedCount = 0;

  const seats: SeatStatusItem[] = allSeats.map((seat) => {
    let price = show.silverPrice;
    if (seat.category.code === "GOLD") price = show.goldPrice;
    if (seat.category.code === "PREMIUM") price = show.premiumPrice;

    if (bookedSeatIdSet.has(seat.id)) {
      bookedCount++;
      return {
        id: seat.id,
        row: seat.row,
        number: seat.number,
        categoryId: seat.categoryId,
        categoryName: seat.category.name,
        categoryCode: seat.category.code,
        price,
        status: "BOOKED",
      };
    }

    const hold = activeHoldMap.get(seat.id);
    if (hold) {
      heldCount++;
      const isMine = currentUserId ? hold.userId === currentUserId : false;
      return {
        id: seat.id,
        row: seat.row,
        number: seat.number,
        categoryId: seat.categoryId,
        categoryName: seat.category.name,
        categoryCode: seat.category.code,
        price,
        status: isMine ? "AVAILABLE" : "HELD", // Allow the user who holds it to view as selected/available
        heldByCurrentUser: isMine,
      };
    }

    availableCount++;
    return {
      id: seat.id,
      row: seat.row,
      number: seat.number,
      categoryId: seat.categoryId,
      categoryName: seat.category.name,
      categoryCode: seat.category.code,
      price,
      status: "AVAILABLE",
    };
  });

  return {
    show,
    seats,
    summary: {
      total: allSeats.length,
      available: availableCount,
      held: heldCount,
      booked: bookedCount,
    },
  };
}

export async function createSeatHold(
  showId: string,
  seatIds: string[],
  userId: string,
  holdMinutes: number = 5
): Promise<{ holdToken: string; expiresAt: Date; seatIds: string[] }> {
  if (!seatIds || seatIds.length === 0) {
    throw new Error("NO_SEATS_SELECTED");
  }

  // 1. Purge expired holds
  await cleanupExpiredHolds();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + holdMinutes * 60 * 1000);
  const holdToken = `HOLD-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

  // 2. Perform atomic reservation in transaction
  return await prisma.$transaction(async (tx) => {
    // Check if any seat is already booked for this show
    const alreadyBooked = await tx.bookingSeat.findFirst({
      where: {
        showId,
        seatId: { in: seatIds },
        booking: { status: "CONFIRMED" },
      },
      include: { seat: true },
    });

    if (alreadyBooked) {
      throw new Error(`SEAT_ALREADY_BOOKED: Seat ${alreadyBooked.seat.row}${alreadyBooked.seat.number} is already booked.`);
    }

    // Check if any seat is currently held by someone else
    const alreadyHeld = await tx.seatHold.findFirst({
      where: {
        showId,
        seatId: { in: seatIds },
        userId: { not: userId },
        expiresAt: { gt: now },
      },
      include: { seat: true },
    });

    if (alreadyHeld) {
      throw new Error(`SEAT_ALREADY_HELD: Seat ${alreadyHeld.seat.row}${alreadyHeld.seat.number} is temporarily reserved by another customer.`);
    }

    // Release any previous holds this user has for these seats
    await tx.seatHold.deleteMany({
      where: {
        showId,
        seatId: { in: seatIds },
        userId,
      },
    });

    // Create new holds
    for (const seatId of seatIds) {
      await tx.seatHold.create({
        data: {
          showId,
          seatId,
          userId,
          holdToken,
          expiresAt,
        },
      });
    }

    return {
      holdToken,
      expiresAt,
      seatIds,
    };
  });
}

export async function releaseSeatHold(holdToken: string): Promise<number> {
  const result = await prisma.seatHold.deleteMany({
    where: { holdToken },
  });
  return result.count;
}
