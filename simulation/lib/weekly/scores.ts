import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Points earned for completing a weekly challenge — a performance score, not a
 * flat 1: start at 100, lose a point per second and 10 per wrong placement, with
 * a floor so finishing always pays something. Faster + cleaner = more points.
 * Tune the constants here; the migration backfill mirrors this exact formula.
 */
const BASE_POINTS = 100;
const TIME_PENALTY_PER_SEC = 1;
const MISTAKE_PENALTY = 10;
const MIN_POINTS = 10;

export function scoreFor(durationMs: number, mistakes: number): number {
  const seconds = Math.floor(Math.max(0, durationMs) / 1000);
  const raw =
    BASE_POINTS -
    seconds * TIME_PENALTY_PER_SEC -
    Math.max(0, mistakes) * MISTAKE_PENALTY;
  return Math.max(MIN_POINTS, raw);
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  points: number;
  /** Average solve time across the user's wins, in ms (null if untimed). */
  avg_ms: number | null;
  /** Total wrong placements across all the user's solves. */
  total_mistakes: number;
  /** Average wrong placements per solve. */
  avg_mistakes: number;
  last_completed: string | null;
}

/**
 * Top entries on the weekly-challenge leaderboard: most points first (points
 * already fold in speed + mistakes via scoreFor), ties broken by fastest average
 * solve time. The view only includes users who have scored.
 */
export async function fetchLeaderboard(
  supabase: SupabaseClient,
  limit = 50,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("wc_leaderboard")
    .select(
      "user_id, display_name, points, avg_ms, total_mistakes, avg_mistakes, last_completed",
    )
    .order("points", { ascending: false })
    .order("avg_ms", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

/** Whether this user has already earned the point for the given week. */
export async function hasCompletedWeek(
  supabase: SupabaseClient,
  userId: string,
  weekKey: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("wc_challenge_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("week_key", weekKey);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export type AwardResult =
  | { status: "awarded"; points: number }
  | { status: "already" }
  | { status: "error"; message: string };

/**
 * Award the weekly score. Points reflect performance (see scoreFor) — faster,
 * cleaner solves earn more. The unique (user_id, week_key) constraint means a
 * second attempt in the same week is a no-op (returns "already").
 */
export async function awardWeeklyPoint(
  supabase: SupabaseClient,
  userId: string,
  weekKey: string,
  product: string,
  durationMs: number,
  mistakes: number,
): Promise<AwardResult> {
  const points = scoreFor(durationMs, mistakes);
  const { error } = await supabase
    .from("wc_challenge_completions")
    .insert({
      user_id: userId,
      week_key: weekKey,
      product,
      duration_ms: Math.max(0, Math.round(durationMs)),
      mistakes: Math.max(0, Math.round(mistakes)),
      points,
    });

  if (!error) return { status: "awarded", points };
  // 23505 = unique_violation → already earned this week.
  if (error.code === "23505") return { status: "already" };
  return { status: "error", message: error.message };
}
