import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const allBookings = await prisma.booking.findMany({
      include: {
        seats: true,
        payment: true,
        cancellation: { include: { refund: true } },
        show: {
          include: {
            movie: true,
            screen: { include: { theatre: true } },
          },
        },
      },
    });

    // 1. Booking & Cancellation Summaries
    const confirmedList = allBookings.filter((b) => b.status === "CONFIRMED");
    const cancelledList = allBookings.filter((b) => b.status === "CANCELLED");

    const totalConfirmedRevenue = confirmedList.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalRefundedAmount = cancelledList.reduce(
      (sum, b) => sum + (b.cancellation?.refundAmount || 0),
      0
    );
    const netRevenue = totalConfirmedRevenue;

    // 2. Sales by Period (Daily, Weekly, Monthly)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailySales = confirmedList
      .filter((b) => new Date(b.createdAt) >= oneDayAgo)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const weeklySales = confirmedList
      .filter((b) => new Date(b.createdAt) >= oneWeekAgo)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const monthlySales = confirmedList
      .filter((b) => new Date(b.createdAt) >= oneMonthAgo)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // 3. Movie-wise Occupancy & Sales
    const movieStatsMap = new Map<string, { title: string; shows: number; capacity: number; booked: number; revenue: number }>();
    const allShows = await prisma.show.findMany({
      include: {
        movie: true,
        screen: { include: { theatre: true } },
        bookingSeats: { where: { booking: { status: "CONFIRMED" } } },
      },
    });

    for (const s of allShows) {
      const mId = s.movieId;
      if (!movieStatsMap.has(mId)) {
        movieStatsMap.set(mId, {
          title: s.movie.title,
          shows: 0,
          capacity: 0,
          booked: 0,
          revenue: 0,
        });
      }
      const item = movieStatsMap.get(mId)!;
      item.shows += 1;
      item.capacity += s.screen.totalSeats || 48;
      item.booked += s.bookingSeats.length;
    }

    // Add revenues
    confirmedList.forEach((b) => {
      const mId = b.show.movieId;
      if (movieStatsMap.has(mId)) {
        movieStatsMap.get(mId)!.revenue += b.totalAmount;
      }
    });

    const movieOccupancy = Array.from(movieStatsMap.values()).map((m) => ({
      ...m,
      occupancy: m.capacity > 0 ? Math.round((m.booked / m.capacity) * 100) : 0,
    }));

    // 4. Theatre-wise Occupancy & Sales
    const theatreStatsMap = new Map<string, { name: string; city: string; shows: number; capacity: number; booked: number; revenue: number }>();

    for (const s of allShows) {
      const tId = s.screen.theatreId;
      if (!theatreStatsMap.has(tId)) {
        theatreStatsMap.set(tId, {
          name: s.screen.theatre.name,
          city: s.screen.theatre.city,
          shows: 0,
          capacity: 0,
          booked: 0,
          revenue: 0,
        });
      }
      const item = theatreStatsMap.get(tId)!;
      item.shows += 1;
      item.capacity += s.screen.totalSeats || 48;
      item.booked += s.bookingSeats.length;
    }

    confirmedList.forEach((b) => {
      const tId = b.show.screen.theatreId;
      if (theatreStatsMap.has(tId)) {
        theatreStatsMap.get(tId)!.revenue += b.totalAmount;
      }
    });

    const theatreOccupancy = Array.from(theatreStatsMap.values()).map((t) => ({
      ...t,
      occupancy: t.capacity > 0 ? Math.round((t.booked / t.capacity) * 100) : 0,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalBookings: allBookings.length,
        confirmedBookings: confirmedList.length,
        cancelledBookings: cancelledList.length,
        cancellationRate: allBookings.length > 0 ? Math.round((cancelledList.length / allBookings.length) * 100) : 0,
        totalConfirmedRevenue,
        totalRefundedAmount,
        netRevenue,
        dailySales,
        weeklySales,
        monthlySales,
      },
      movieOccupancy,
      theatreOccupancy,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
