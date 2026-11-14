import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: user.userId },
      include: {
        show: {
          include: {
            movie: true,
            screen: {
              include: {
                theatre: true,
              },
            },
          },
        },
        seats: {
          include: {
            seat: {
              include: {
                category: true,
              },
            },
          },
        },
        payment: true,
        ticket: true,
        cancellation: {
          include: {
            refund: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const upcoming = bookings.filter(
      (b) => b.status === "CONFIRMED" && new Date(b.show.startTime) >= now
    );
    const past = bookings.filter(
      (b) => b.status === "CANCELLED" || new Date(b.show.startTime) < now
    );

    return NextResponse.json({
      success: true,
      upcoming,
      past,
      all: bookings,
    });
  } catch (err: any) {
    console.error("User bookings API error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
