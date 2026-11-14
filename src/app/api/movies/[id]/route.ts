import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    const cityParam = searchParams.get("city");

    const movie = await prisma.movie.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ error: "MOVIE_NOT_FOUND" }, { status: 404 });
    }

    // Determine date range for shows
    let startOfDay = new Date();
    let endOfDay = new Date();

    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
        endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
      }
    } else {
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setDate(endOfDay.getDate() + 3); // Default next 3 days
      endOfDay.setHours(23, 59, 59, 999);
    }

    const showWhere: any = {
      movieId: movie.id,
      isActive: true,
      startTime: {
        gte: new Date(), // Only future shows
        lte: endOfDay,
      },
    };

    if (cityParam) {
      showWhere.screen = {
        theatre: {
          city: { contains: cityParam },
        },
      };
    }

    const shows = await prisma.show.findMany({
      where: showWhere,
      include: {
        screen: {
          include: {
            theatre: true,
          },
        },
        _count: {
          select: {
            bookingSeats: true,
            seatHolds: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Group shows by Theatre
    const theatreMap = new Map<string, any>();
    for (const show of shows) {
      const theatre = show.screen.theatre;
      if (!theatreMap.has(theatre.id)) {
        theatreMap.set(theatre.id, {
          theatreId: theatre.id,
          name: theatre.name,
          city: theatre.city,
          address: theatre.address,
          facilities: theatre.facilities,
          shows: [],
        });
      }

      const bookedCount = show._count.bookingSeats;
      const totalSeats = show.screen.totalSeats || 48;
      const remainingSeats = Math.max(0, totalSeats - bookedCount);

      let status = "AVAILABLE";
      if (remainingSeats <= 5) status = "ALMOST_FULL";
      else if (remainingSeats <= 15) status = "FILLING_FAST";

      theatreMap.get(theatre.id).shows.push({
        id: show.id,
        startTime: show.startTime,
        endTime: show.endTime,
        screenName: show.screen.name,
        screenFormat: show.screen.format,
        silverPrice: show.silverPrice,
        goldPrice: show.goldPrice,
        premiumPrice: show.premiumPrice,
        remainingSeats,
        totalSeats,
        status,
      });
    }

    return NextResponse.json({
      movie: {
        ...movie,
        genreNames: movie.genres.map((g) => g.genre.name),
      },
      theatres: Array.from(theatreMap.values()),
    });
  } catch (err: any) {
    console.error("Movie detail API error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
