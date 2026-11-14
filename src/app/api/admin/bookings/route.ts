import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const movieId = searchParams.get("movieId");

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (movieId) {
      where.show = { movieId };
    }

    if (search) {
      where.OR = [
        { bookingReference: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { show: { movie: { title: { contains: search } } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        show: {
          include: {
            movie: true,
            screen: { include: { theatre: true } },
          },
        },
        seats: {
          include: {
            seat: { include: { category: true } },
          },
        },
        payment: true,
        ticket: true,
        cancellation: { include: { refund: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, bookings });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
