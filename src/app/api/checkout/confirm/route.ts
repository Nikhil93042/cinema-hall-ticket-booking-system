import { NextResponse } from "next/server";
import { confirmBooking } from "@/lib/booking-service";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const checkoutSchema = z.object({
  holdToken: z.string().min(1, "Hold token is required"),
  paymentMethod: z.enum(["CARD", "UPI", "NET_BANKING", "SIMULATED"]).default("CARD"),
  idempotencyKey: z.string().optional(),
  simulatePaymentStatus: z.enum(["SUCCESS", "FAILED", "CANCELLED"]).default("SUCCESS"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Please sign in to complete your booking." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = checkoutSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { holdToken, paymentMethod, idempotencyKey, simulatePaymentStatus } = validated.data;

    const result = await confirmBooking({
      holdToken,
      userId: user.userId,
      paymentMethod,
      idempotencyKey,
      simulatePaymentStatus,
    });

    return NextResponse.json({
      success: true,
      booking: result.booking,
      isIdempotentReplay: result.isIdempotentReplay,
    });
  } catch (err: any) {
    console.error("Confirm booking API error:", err);

    if (err.message?.startsWith("HOLD_EXPIRED_OR_INVALID")) {
      return NextResponse.json(
        { error: "HOLD_EXPIRED", message: err.message },
        { status: 410 }
      );
    }

    if (err.message?.startsWith("CONCURRENCY_CONFLICT")) {
      return NextResponse.json(
        { error: "SEAT_CONFLICT", message: err.message },
        { status: 409 }
      );
    }

    if (err.message?.startsWith("PAYMENT_FAILED")) {
      return NextResponse.json(
        { error: "PAYMENT_FAILED", message: err.message },
        { status: 402 }
      );
    }

    if (err.message?.startsWith("PAYMENT_CANCELLED")) {
      return NextResponse.json(
        { error: "PAYMENT_CANCELLED", message: err.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message || "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
