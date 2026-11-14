import { NextResponse } from "next/server";
import { getShowSeatAvailability } from "@/lib/seat-locking";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const showId = params.id;
    const currentUser = await getCurrentUser();

    const data = await getShowSeatAvailability(showId, currentUser?.userId);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    console.error("Get seat availability error:", err);
    if (err.message === "SHOW_NOT_FOUND") {
      return NextResponse.json({ error: "SHOW_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: err.message },
      { status: 500 }
    );
  }
}
