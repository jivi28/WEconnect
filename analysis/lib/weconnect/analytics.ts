import { getServiceClient } from "./supabase";
import { isMockMode, getMockMetrics } from "./mock";
import { scoreEvents, aggregateRegions, buildFunnel } from "./roi";
import type {
  EventMetrics,
  RoiWeights,
  ScoredEvent,
  RegionAnalytics,
  FunnelStep,
} from "./types";

interface MetricsFilter {
  /** ISO date (inclusive) lower bound on event start_date. */
  from?: string;
  /** ISO date (inclusive) upper bound on event start_date. */
  to?: string;
  /** Restrict to these event types (e.g. ["career","seminar"]). Empty = all. */
  types?: string[];
}

/** Pull raw per-event metrics from the Postgres view, with optional filters. */
export async function fetchEventMetrics(
  filter: MetricsFilter = {}
): Promise<EventMetrics[]> {
  const types = filter.types?.length ? filter.types : null;

  // No Supabase configured → serve synthesized metrics so the dashboard runs locally.
  if (isMockMode()) {
    return getMockMetrics().filter((m) => {
      if (filter.from && (m.start_date ?? "") < filter.from) return false;
      if (filter.to && (m.start_date ?? "") > filter.to) return false;
      if (types && !types.includes(m.type ?? "")) return false;
      return true;
    });
  }

  const supabase = getServiceClient();
  let query = supabase.from("event_metrics").select("*");

  if (filter.from) query = query.gte("start_date", filter.from);
  if (filter.to) query = query.lte("start_date", filter.to);
  if (types) query = query.in("type", types);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load event_metrics: ${error.message}`);
  return (data ?? []) as EventMetrics[];
}

/** All events scored relative to each other — for map markers + leaderboard. */
export async function getScoredEvents(
  weights?: RoiWeights,
  filter?: MetricsFilter
): Promise<ScoredEvent[]> {
  const metrics = await fetchEventMetrics(filter);
  return scoreEvents(metrics, weights).sort((a, b) => b.roi - a.roi);
}

/** Full analytics for a single event (the "Generate Analytics" payload). */
export async function getEventAnalytics(
  eventId: string,
  weights?: RoiWeights,
  filter?: MetricsFilter
): Promise<(ScoredEvent & { funnel: FunnelStep[] }) | null> {
  const scored = await getScoredEvents(weights, filter);
  const event = scored.find((e) => e.event_id === eventId);
  if (!event) return null;
  return { ...event, funnel: buildFunnel(event) };
}

/** Region rollup, optionally narrowed to a single region. */
export async function getRegionAnalytics(
  region?: string,
  weights?: RoiWeights,
  filter?: MetricsFilter
): Promise<RegionAnalytics[]> {
  const scored = await getScoredEvents(weights, filter);
  const regions = aggregateRegions(scored);
  if (!region) return regions;
  return regions.filter(
    (r) => r.region.toLowerCase() === region.toLowerCase()
  );
}

export type { FunnelStep };
