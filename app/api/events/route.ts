import { NextRequest, NextResponse } from "next/server";
import { getScoredEvents } from "@/lib/analytics";
import { weightsFromParams } from "@/lib/roi";
import { isMockMode } from "@/lib/mock";

export const dynamic = "force-dynamic";

// GET /api/events?wU=&wC=&wS=&from=&to=&types=career,seminar
// All events scored relative to each other — feeds the map markers + leaderboard.
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const typesParam = params.get("types");
    const events = await getScoredEvents(weightsFromParams(params), {
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      types: typesParam ? typesParam.split(",").filter(Boolean) : undefined,
    });
    return NextResponse.json({ events, mock: isMockMode() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
