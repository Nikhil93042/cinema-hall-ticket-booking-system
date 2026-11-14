import { NextResponse } from "next/server";
import { validateTicket } from "@/lib/booking-service";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const validateSchema = z.object({
  ticketCode: z.string().min(1, "Ticket code or QR payload required"),
  usherName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    // Allow admin or staff; if logged in user is admin, use their name
    const usherName = user ? `${user.name} (${user.role})` : "Gate Usher / Scanner";

    const body = await req.json();
    const validated = validateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "INVALID_REQUEST", details: validated.error.flatten() }, { status: 400 });
    }

    const result = await validateTicket(
      validated.data.ticketCode,
      validated.data.usherName || usherName
    );

    return NextResponse.json({
      success: true,
      message: "Ticket validated successfully. Entry approved!",
      ticket: result.ticket,
      booking: result.booking,
    });
  } catch (err: any) {
    console.error("Ticket validate API error:", err);

    if (err.message?.startsWith("TICKET_ALREADY_VALIDATED")) {
      return NextResponse.json(
        { error: "ALREADY_VALIDATED", message: err.message },
        { status: 409 }
      );
    }
    if (err.message?.startsWith("TICKET_CANCELLED")) {
      return NextResponse.json(
        { error: "TICKET_CANCELLED", message: err.message },
        { status: 403 }
      );
    }
    if (err.message?.startsWith("TICKET_NOT_FOUND")) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: err.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message || "Failed to validate ticket" },
      { status: 500 }
    );
  }
}
