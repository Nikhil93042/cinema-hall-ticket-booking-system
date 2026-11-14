import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const movieSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  description: z.string().min(5, "Description is required"),
  posterUrl: z.string().url("Valid poster image URL required"),
  bannerUrl: z.string().url("Valid banner image URL required"),
  duration: z.coerce.number().min(10, "Duration must be at least 10 minutes"),
  releaseDate: z.string(),
  rating: z.coerce.number().min(0).max(10),
  language: z.string().min(1),
  format: z.string().min(1),
  director: z.string().min(1),
  cast: z.string().min(1),
  trailerUrl: z.string().optional(),
  isFeatured: z.boolean().default(false),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const movies = await prisma.movie.findMany({
      include: {
        genres: { include: { genre: true } },
        _count: { select: { shows: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const allGenres = await prisma.genre.findMany({ orderBy: { name: "asc" } });

    return NextResponse.json({
      success: true,
      movies: movies.map((m) => ({
        ...m,
        genreNames: m.genres.map((g) => g.genre.name),
        showsCount: m._count.shows,
      })),
      genres: allGenres,
    });
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
    const validated = movieSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", details: validated.error.flatten() }, { status: 400 });
    }

    const data = validated.data;
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const movie = await prisma.movie.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        posterUrl: data.posterUrl,
        bannerUrl: data.bannerUrl,
        duration: data.duration,
        releaseDate: new Date(data.releaseDate),
        rating: data.rating,
        language: data.language,
        format: data.format,
        director: data.director,
        cast: data.cast,
        trailerUrl: data.trailerUrl || null,
        isFeatured: data.isFeatured,
        isActive: true,
      },
    });

    // Link genres
    for (const gName of data.genres) {
      let genreRecord = await prisma.genre.findFirst({
        where: { OR: [{ name: gName }, { slug: gName.toLowerCase() }] },
      });
      if (!genreRecord) {
        genreRecord = await prisma.genre.create({
          data: { name: gName, slug: gName.toLowerCase() },
        });
      }
      await prisma.movieGenre.create({
        data: { movieId: movie.id, genreId: genreRecord.id },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "MOVIE_CREATED",
        entityType: "Movie",
        entityId: movie.id,
        details: JSON.stringify({ title: movie.title, slug }),
      },
    });

    return NextResponse.json({ success: true, movie }, { status: 201 });
  } catch (err: any) {
    console.error("Create movie error:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
