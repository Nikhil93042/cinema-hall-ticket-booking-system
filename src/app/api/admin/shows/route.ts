import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const showSchema = z.object({
  movieId: z.string().min(1, "Movie is required"),
  screenId: z.string().min(1, "Screen is required"),
  startTime: z.string().min(1, "Start time is required"),
  silverPrice: z.coerce.number().min(50).default(200),
  goldPrice: z.coerce.number().min(50).default(350),
  premiumPrice: z.coerce.number().min(50).default(500),
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const movieId = searchParams.get("movieId");
    const theatreId = searchParams.get("theatreId");

    const where: any = { isActive: true };
    if (movieId) where.movieId = movieId;
    if (theatreId) {
      where.screen = { theatreId };
    }

    const shows = await prisma.show.findMany({
      where,
      include: {
        movie: true,
        screen: { include: { theatre: true } },
        _count: { select: { bookingSeats: true } },
      },
      orderBy: { startTime: "asc" },
      take: 100,
    });

    const formatted = shows.map((s) => ({
      ...s,
      totalSeats: s.screen.totalSeats || 48,
      bookedSeats: s._count.bookingSeats,
      occupancy: Math.round((s._count.bookingSeats / (s.screen.totalSeats || 48)) * 100),
    }));

    return NextResponse.json({ success: true, shows: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const body = await req.json();
    const validated = showSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", details: validated.error.flatten() }, { status: 400 });
    }

    const { movieId, screenId, startTime: startTimeStr, silverPrice, goldPrice, premiumPrice } = validated.data;

    const movie = await prisma.movie.findUnique({ where: { id: movieId } });
    if (!movie) {
      return NextResponse.json({ error: "MOVIE_NOT_FOUND" }, { status: 404 });
    }

    const screen = await prisma.screen.findUnique({ where: { id: screenId }, include: { theatre: true } });
    if (!screen) {
      return NextResponse.json({ error: "SCREEN_NOT_FOUND" }, { status: 404 });
    }

    const startTime = new Date(startTimeStr);
    if (isNaN(startTime.getTime()) || startTime < new Date()) {
      return NextResponse.json({ error: "INVALID_TIME", message: "Showtime must be in the future." }, { status: 400 });
    }

    // End time = start time + movie duration + 20 minutes buffer for cleaning/previews
    const endTime = new Date(startTime.getTime() + (movie.duration + 20) * 60 * 1000);

    // Overlap schedule conflict check on the same screen!
    const overlappingShow = await prisma.show.findFirst({
      where: {
        screenId,
        isActive: true,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      include: { movie: true },
    });

    if (overlappingShow) {
      return NextResponse.json(
        {
          error: "OVERLAPPING_SCHEDULE_CONFLICT",
          message: `Schedule conflict: Screen is already reserved for "${overlappingShow.movie.title}" between ${overlappingShow.startTime.toLocaleTimeString()} and ${overlappingShow.endTime.toLocaleTimeString()}.`,
        },
        { status: 409 }
      );
    }

    const newShow = await prisma.show.create({
      data: {
        movieId,
        screenId,
        startTime,
        endTime,
        silverPrice,
        goldPrice,
        premiumPrice,
      },
      include: {
        movie: true,
        screen: { include: { theatre: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "SHOW_SCHEDULED",
        entityType: "Show",
        entityId: newShow.id,
        details: JSON.stringify({
          movie: movie.title,
          theatre: screen.theatre.name,
          screen: screen.name,
          startTime,
        }),
      },
    });

    return NextResponse.json({ success: true, show: newShow }, { status: 201 });
  } catch (err: any) {
    console.error("Create show error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
