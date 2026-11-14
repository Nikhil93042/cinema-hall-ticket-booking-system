import { NextResponse } from "next/server";
import { createSeatHold } from "@/lib/seat-locking";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const holdSchema = z.object({
  seatIds: z.array(z.string()).min(1, "Select at least 1 seat"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const showId = params.id;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please sign in to reserve seats." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = holdSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await createSeatHold(showId, validated.data.seatIds, user.userId, 5);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("Hold seats API error:", err);
    if (err.message?.startsWith("SEAT_ALREADY_BOOKED") || err.message?.startsWith("SEAT_ALREADY_HELD")) {
      return NextResponse.json(
        { error: "SEAT_CONFLICT", message: err.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message || "Failed to hold seats" },
      { status: 500 }
    );
  }
}
