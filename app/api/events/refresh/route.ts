import { NextResponse } from "next/server";
import { refreshEvents } from "@/scripts/scrape-events";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/events/refresh — re-scrape Würth events + geocode + upsert to Supabase.
export async function POST() {
  try {
    const result = await refreshEvents();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
