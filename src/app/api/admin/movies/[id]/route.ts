import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        posterUrl: body.posterUrl,
        bannerUrl: body.bannerUrl,
        duration: body.duration ? parseInt(body.duration) : undefined,
        rating: body.rating ? parseFloat(body.rating) : undefined,
        language: body.language,
        format: body.format,
        director: body.director,
        cast: body.cast,
        isFeatured: body.isFeatured !== undefined ? body.isFeatured : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "MOVIE_UPDATED",
        entityType: "Movie",
        entityId: id,
        details: JSON.stringify({ title: movie.title }),
      },
    });

    return NextResponse.json({ success: true, movie });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const { id } = params;
    // Soft delete movie to preserve historic booking references
    const movie = await prisma.movie.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "MOVIE_DEACTIVATED",
        entityType: "Movie",
        entityId: id,
        details: JSON.stringify({ title: movie.title }),
      },
    });

    return NextResponse.json({ success: true, message: "Movie deactivated successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
