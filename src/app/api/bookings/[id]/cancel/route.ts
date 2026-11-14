import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/booking-service";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const cancelSchema = z.object({
  reason: z.string().min(3, "Please provide a reason for cancellation"),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = params;
    let reason = "Customer requested cancellation";

    try {
      const body = await req.json();
      const validated = cancelSchema.safeParse(body);
      if (validated.success) {
        reason = validated.data.reason;
      }
    } catch (e) {
      // Default reason
    }

    const result = await cancelBooking(id, user.userId, user.role, reason);

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully. Simulated refund processed.",
      ...result,
    });
  } catch (err: any) {
    console.error("Cancel booking API error:", err);

    if (err.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: "FORBIDDEN", message: err.message }, { status: 403 });
    }
    if (err.message?.startsWith("CANCELLATION_WINDOW_CLOSED")) {
      return NextResponse.json({ error: "WINDOW_CLOSED", message: err.message }, { status: 400 });
    }
    if (err.message === "BOOKING_ALREADY_CANCELLED") {
      return NextResponse.json({ error: "ALREADY_CANCELLED", message: err.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
