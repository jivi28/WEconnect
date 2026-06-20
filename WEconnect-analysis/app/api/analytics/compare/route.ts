import { NextRequest, NextResponse } from "next/server";
import { getScoredEvents } from "@/lib/analytics";
import { weightsFromParams } from "@/lib/roi";

export const dynamic = "force-dynamic";

// GET /api/analytics/compare?ids=a,b&...  — side-by-side event comparison.
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const ids = (search.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length < 2) {
      return NextResponse.json(
        { error: "Provide at least two event ids: ?ids=a,b" },
        { status: 400 }
      );
    }
    const scored = await getScoredEvents(weightsFromParams(search));
    const events = ids
      .map((id) => scored.find((e) => e.event_id === id))
      .filter(Boolean);
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
