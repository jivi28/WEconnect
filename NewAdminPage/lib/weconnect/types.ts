// Shared domain types for the WEconnect analysis module.

export type EventType =
  | "career"
  | "seminar"
  | "exhibition"
  | "webinar"
  | "partner"
  | "other";

export interface EventRow {
  id: string;
  name: string;
  type: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string | null;
  end_date: string | null;
  source_url: string | null;
  cost: number | null;
  is_wuerth: boolean;
}

// One row of public.event_metrics (raw, pre-scoring metrics).
export interface EventMetrics {
  event_id: string;
  name: string;
  type: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  start_date: string | null;
  end_date: string | null;
  cost: number | null;
  is_wuerth: boolean;
  new_users: number;
  total_connections: number;
  total_simulations: number;
  avg_connections: number;
  avg_simulations: number;
  // Distinct users who made >=1 connection / ran >=1 simulation (for the funnel).
  users_connected: number;
  users_simulated: number;
}

export type RoiTier = "good" | "mid" | "poor";

export interface RoiWeights {
  users: number;
  connections: number;
  simulations: number;
}

// An event with its computed composite ROI score, ready for the map/panels.
export interface ScoredEvent extends EventMetrics {
  roi: number; // 0..100
  tier: RoiTier;
  valuePerEuro: number | null; // cost-adjusted ROI, null when cost unknown
  confidence: number; // 0..1 sample-size confidence (few attendees => low)
  lowData: boolean; // true when the sample is too small to trust the rates
}

export interface FunnelStep {
  label: string;
  value: number;
  /** Share of the previous step that reached this step (0..1). Top step = 1. */
  conversion: number;
  /** Share of signups that reached this step (0..1). */
  ofSignups: number;
}

export interface RegionAnalytics {
  region: string;
  roi: number; // 0..100, weighted by new_users by default
  tier: RoiTier;
  eventCount: number;
  totalNewUsers: number;
  totalConnections: number;
  totalSimulations: number;
  confidence: number; // 0..1 based on total attendees across the region
  lowData: boolean;
  events: ScoredEvent[]; // ranked best -> worst
}
