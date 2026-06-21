import type {
  EventMetrics,
  RoiTier,
  RoiWeights,
  ScoredEvent,
  RegionAnalytics,
  FunnelStep,
} from "./types";

export const DEFAULT_WEIGHTS: RoiWeights = {
  users: 0.4,
  connections: 0.3,
  simulations: 0.3,
};

/**
 * Absolute "what good looks like" targets for one event. ROI scores each metric
 * against these benchmarks (not against the other events in view), so a weak
 * event reads as weak even when it is the only one in the current filter.
 * Tune these to Würth's real expectations.
 */
export const BENCHMARKS = {
  newUsers: 15, // a strong event acquires ~15 new platform users (demo-scale)
  avgConnections: 3, // a healthy attendee makes ~3 connections
  avgSimulations: 3, // an engaged attendee runs ~3 simulations
};

/**
 * Sample-size smoothing. confidence = n / (n + K): an event with K attendees is
 * 50% trusted. Per-attendee rates are shrunk by this factor so a tiny event
 * where "both attendees engaged" can't post a perfect score off 2 data points.
 */
export const CONFIDENCE_K = 6;
/** Below this many attendees we flag the figures as not yet reliable. */
export const LOW_DATA_THRESHOLD = 5;

export function confidenceFor(sampleSize: number): number {
  return sampleSize / (sampleSize + CONFIDENCE_K);
}

/** ROI score >= 66 is "good" (green), 33..66 "mid" (amber), < 33 "poor" (red). */
export function tierFor(roi: number): RoiTier {
  if (roi >= 66) return "good";
  if (roi >= 33) return "mid";
  return "poor";
}

/** Normalize weights so they always sum to 1 (UI sliders may not). */
function normalizeWeights(w: RoiWeights): RoiWeights {
  const sum = w.users + w.connections + w.simulations;
  if (sum <= 0) return DEFAULT_WEIGHTS;
  return {
    users: w.users / sum,
    connections: w.connections / sum,
    simulations: w.simulations / sum,
  };
}

/** Score a value against an absolute target, saturating at 1 (0..1). */
function vsBenchmark(value: number, target: number): number {
  if (target <= 0) return value > 0 ? 1 : 0;
  return Math.min(value / target, 1);
}

/**
 * Score events on an absolute 0..100 ROI scale. Each metric (new users, avg
 * connections, avg simulations) is measured against a fixed benchmark of "what
 * good looks like" and combined with `weights`. Because scoring is absolute, a
 * low-engagement event reads low even when it is the only event in the current
 * filter — and the score is directly comparable across regions and time ranges.
 */
export function scoreEvents(
  metrics: EventMetrics[],
  weights: RoiWeights = DEFAULT_WEIGHTS
): ScoredEvent[] {
  const w = normalizeWeights(weights);

  return metrics.map((m) => {
    const confidence = confidenceFor(m.new_users);

    const nu = vsBenchmark(m.new_users, BENCHMARKS.newUsers);
    // Engagement rates are shrunk by confidence: small samples can't max them out.
    const nc = vsBenchmark(m.avg_connections * confidence, BENCHMARKS.avgConnections);
    const ns = vsBenchmark(m.avg_simulations * confidence, BENCHMARKS.avgSimulations);

    const roi = Math.round(
      100 * (w.users * nu + w.connections * nc + w.simulations * ns)
    );

    // Raw "value" used for the cost-adjusted figure.
    const rawValue = m.new_users + m.total_connections + m.total_simulations;
    const valuePerEuro =
      m.cost && m.cost > 0 ? Number((rawValue / m.cost).toFixed(3)) : null;

    return {
      ...m,
      roi,
      tier: tierFor(roi),
      valuePerEuro,
      confidence: Number(confidence.toFixed(2)),
      lowData: m.new_users < LOW_DATA_THRESHOLD,
    };
  });
}

/**
 * Aggregate scored events by region. Regional ROI is the new-user-weighted
 * average of member-event ROI scores (falls back to a plain average when a
 * region has no users yet), matching the "average ROI per region" requirement.
 *
 * `keyOf` selects the grouping granularity — defaults to region/country, but can
 * group by city (or any other key) so finer-grained leaders aren't hidden inside
 * a coarser bucket. The returned `region` field holds whatever key was used.
 */
export function aggregateRegions(
  scored: ScoredEvent[],
  keyOf: (e: ScoredEvent) => string = (e) => e.region || e.country || "Unknown"
): RegionAnalytics[] {
  const byRegion = new Map<string, ScoredEvent[]>();
  for (const ev of scored) {
    const key = keyOf(ev);
    const list = byRegion.get(key) ?? [];
    list.push(ev);
    byRegion.set(key, list);
  }

  const regions: RegionAnalytics[] = [];
  for (const [region, events] of byRegion) {
    const totalNewUsers = events.reduce((s, e) => s + e.new_users, 0);
    const weightSum = totalNewUsers > 0 ? totalNewUsers : events.length;

    const roi = Math.round(
      events.reduce((s, e) => {
        const weight = totalNewUsers > 0 ? e.new_users : 1;
        return s + e.roi * weight;
      }, 0) / weightSum
    );

    const ranked = [...events].sort((a, b) => b.roi - a.roi);
    const confidence = confidenceFor(totalNewUsers);

    regions.push({
      region,
      roi,
      tier: tierFor(roi),
      eventCount: events.length,
      totalNewUsers,
      totalConnections: events.reduce((s, e) => s + e.total_connections, 0),
      totalSimulations: events.reduce((s, e) => s + e.total_simulations, 0),
      confidence: Number(confidence.toFixed(2)),
      lowData: totalNewUsers < LOW_DATA_THRESHOLD * 2,
      events: ranked,
    });
  }

  return regions.sort((a, b) => b.roi - a.roi);
}

/**
 * Post-signup engagement funnel for one event: how many of the people who joined
 * the platform via this event went on to connect, then to run a simulation.
 * Uses distinct user counts (not totals) so each stage is a real subset of the
 * previous one.
 */
export function buildFunnel(event: ScoredEvent): FunnelStep[] {
  const signups = event.new_users;
  const connected = Math.min(signups, event.users_connected);
  const simulated = Math.min(connected, event.users_simulated);

  const step = (label: string, value: number, prev: number): FunnelStep => ({
    label,
    value,
    conversion: prev > 0 ? value / prev : 0,
    ofSignups: signups > 0 ? value / signups : 0,
  });

  return [
    step("Joined via event", signups, signups),
    step("Made a connection", connected, signups),
    step("Ran a simulation", simulated, connected),
  ];
}

/** Parse `wU,wC,wS` query params into weights, falling back to defaults. */
export function weightsFromParams(params: URLSearchParams): RoiWeights {
  const num = (key: string, fallback: number) => {
    const raw = params.get(key);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  return {
    users: num("wU", DEFAULT_WEIGHTS.users),
    connections: num("wC", DEFAULT_WEIGHTS.connections),
    simulations: num("wS", DEFAULT_WEIGHTS.simulations),
  };
}
