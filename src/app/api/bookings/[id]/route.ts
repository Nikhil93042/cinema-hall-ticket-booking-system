import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = params;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingReference: id }],
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
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
    });

    if (!booking) {
      return NextResponse.json({ error: "BOOKING_NOT_FOUND" }, { status: 404 });
    }

    // Authorization: User can only see their own booking unless ADMIN
    if (booking.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    console.error("Get booking API error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
