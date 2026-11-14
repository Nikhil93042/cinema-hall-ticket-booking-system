import { NextResponse } from "next/server";
import { releaseSeatHold } from "@/lib/seat-locking";
import { z } from "zod";

export const dynamic = "force-dynamic";

const releaseSchema = z.object({
  holdToken: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = releaseSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    const count = await releaseSeatHold(validated.data.holdToken);
    return NextResponse.json({ success: true, releasedCount: count });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
