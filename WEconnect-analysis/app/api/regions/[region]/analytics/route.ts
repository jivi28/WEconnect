import { NextRequest, NextResponse } from "next/server";
import { getRegionAnalytics } from "@/lib/analytics";
import { weightsFromParams } from "@/lib/roi";

export const dynamic = "force-dynamic";

// GET /api/regions/[region]/analytics — aggregated ROI for one region.
// Use region="all" to get every region ranked.
export async function GET(
  req: NextRequest,
  { params }: { params: { region: string } }
) {
  try {
    const search = req.nextUrl.searchParams;
    const weights = weightsFromParams(search);
    const filter = {
      from: search.get("from") ?? undefined,
      to: search.get("to") ?? undefined,
    };
    const region = decodeURIComponent(params.region);

    if (region.toLowerCase() === "all") {
      return NextResponse.json({ regions: await getRegionAnalytics(undefined, weights, filter) });
    }

    const regions = await getRegionAnalytics(region, weights, filter);
    if (regions.length === 0) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }
    return NextResponse.json(regions[0]);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
