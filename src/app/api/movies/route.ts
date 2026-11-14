import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const genre = searchParams.get("genre") || "";
    const language = searchParams.get("language") || "";
    const format = searchParams.get("format") || "";
    const featured = searchParams.get("featured");

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { cast: { contains: search } },
        { director: { contains: search } },
      ];
    }

    if (genre) {
      where.genres = {
        some: {
          genre: {
            slug: genre.toLowerCase(),
          },
        },
      };
    }

    if (language) {
      where.language = { contains: language };
    }

    if (format) {
      where.format = { contains: format };
    }

    if (featured === "true") {
      where.isFeatured = true;
    }

    const movies = await prisma.movie.findMany({
      where,
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        shows: {
          where: {
            startTime: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            startTime: true,
          },
        },
      },
      orderBy: [{ rating: "desc" }, { releaseDate: "desc" }],
    });

    const formatted = movies.map((m) => ({
      ...m,
      genreNames: m.genres.map((g) => g.genre.name),
      upcomingShowsCount: m.shows.length,
    }));

    return NextResponse.json({ movies: formatted });
  } catch (err: any) {
    console.error("Movies API error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
