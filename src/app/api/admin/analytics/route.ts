import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Administrator access required." },
        { status: 403 }
      );
    }

    // 1. Metric Counts
    const [totalMovies, totalTheatres, totalShows, totalBookings] = await Promise.all([
      prisma.movie.count({ where: { isActive: true } }),
      prisma.theatre.count({ where: { isActive: true } }),
      prisma.show.count({ where: { isActive: true } }),
      prisma.booking.count(),
    ]);

    // 2. Revenue calculation (only CONFIRMED bookings)
    const confirmedBookings = await prisma.booking.findMany({
      where: { status: "CONFIRMED" },
      select: { totalAmount: true, createdAt: true, showId: true },
    });

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // 3. Occupancy calculation
    const totalBookedSeats = await prisma.bookingSeat.count({
      where: { booking: { status: "CONFIRMED" } },
    });

    const screens = await prisma.screen.findMany({ select: { totalSeats: true } });
    const shows = await prisma.show.findMany({ select: { screen: { select: { totalSeats: true } } } });
    const totalAvailableCapacity = shows.reduce((sum, s) => sum + (s.screen.totalSeats || 48), 0);

    const occupancyRate = totalAvailableCapacity > 0
      ? Math.round((totalBookedSeats / totalAvailableCapacity) * 100)
      : 0;

    // 4. Sales Trends (grouped by last 7 days)
    const last7DaysMap = new Map<string, number>();
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      last7DaysMap.set(key, 0);
    }

    confirmedBookings.forEach((b) => {
      const key = new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (last7DaysMap.has(key)) {
        last7DaysMap.set(key, (last7DaysMap.get(key) || 0) + b.totalAmount);
      }
    });

    const salesTrend = Array.from(last7DaysMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // 5. Popular Movies
    const moviesWithBookings = await prisma.movie.findMany({
      select: {
        id: true,
        title: true,
        posterUrl: true,
        shows: {
          select: {
            bookings: {
              where: { status: "CONFIRMED" },
              select: { totalAmount: true, seats: { select: { id: true } } },
            },
          },
        },
      },
    });

    const popularMovies = moviesWithBookings
      .map((m) => {
        let ticketCount = 0;
        let revenue = 0;
        m.shows.forEach((s) => {
          s.bookings.forEach((b) => {
            revenue += b.totalAmount;
            ticketCount += b.seats.length;
          });
        });
        return {
          id: m.id,
          title: m.title,
          posterUrl: m.posterUrl,
          ticketCount,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 6. Recent Bookings
    const recentBookings = await prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        show: { include: { movie: true, screen: { include: { theatre: true } } } },
        payment: { select: { paymentMethod: true, status: true } },
        seats: { select: { id: true } },
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalMovies,
        totalTheatres,
        totalShows,
        totalBookings,
        totalRevenue,
        occupancyRate,
      },
      salesTrend,
      popularMovies,
      recentBookings,
    });
  } catch (err: any) {
    console.error("Admin analytics error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
