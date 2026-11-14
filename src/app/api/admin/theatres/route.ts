import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const theatreSchema = z.object({
  name: z.string().min(1, "Name is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().optional(),
  facilities: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const theatres = await prisma.theatre.findMany({
      include: {
        screens: {
          include: {
            _count: { select: { seats: true, shows: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, theatres });
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
    const validated = theatreSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR", details: validated.error.flatten() }, { status: 400 });
    }

    const theatre = await prisma.theatre.create({
      data: {
        name: validated.data.name,
        city: validated.data.city,
        address: validated.data.address,
        phone: validated.data.phone || null,
        facilities: validated.data.facilities || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.userId,
        action: "THEATRE_CREATED",
        entityType: "Theatre",
        entityId: theatre.id,
        details: JSON.stringify({ name: theatre.name, city: theatre.city }),
      },
    });

    return NextResponse.json({ success: true, theatre }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
