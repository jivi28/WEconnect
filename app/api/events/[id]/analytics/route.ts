import { NextRequest, NextResponse } from "next/server";
import { getEventAnalytics } from "@/lib/analytics";
import { weightsFromParams } from "@/lib/roi";

export const dynamic = "force-dynamic";

// GET /api/events/[id]/analytics — the "Generate Analytics" payload for one event.
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const search = req.nextUrl.searchParams;
    const analytics = await getEventAnalytics(params.id, weightsFromParams(search), {
      from: search.get("from") ?? undefined,
      to: search.get("to") ?? undefined,
    });
    if (!analytics) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(analytics);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
