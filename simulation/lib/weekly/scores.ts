import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Time penalty per wrong placement, added to a player's effective solve time.
 * Mistakes never block winning the point — they only push you down the board.
 * Tune here (no DB change needed; ranking is computed client-side).
 */
export const PENALTY_MS = 10_000; // 10s per misplacement

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

/** Effective ranking time: raw solve time + a fixed penalty per misplacement. */
export function effectiveMs(row: LeaderboardRow): number {
  return (row.avg_ms ?? 0) + (row.avg_mistakes ?? 0) * PENALTY_MS;
}

/**
 * Top entries on the weekly-challenge leaderboard: most points first, then the
 * lowest *effective* time — which folds in a penalty for wrong placements, so
 * both a slow solve and a sloppy (many-mistake) solve drop you down the board.
 * The view only includes users who have scored. Sorted client-side over the
 * (≤50-row) board so the mistake penalty stays tunable in PENALTY_MS.
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
    .limit(limit);

  if (error) throw error;
  const rows = (data ?? []) as LeaderboardRow[];
  return rows.sort(
    (a, b) => b.points - a.points || effectiveMs(a) - effectiveMs(b),
  );
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
  | { status: "awarded" }
  | { status: "already" }
  | { status: "error"; message: string };

/**
 * Award the weekly point. The unique (user_id, week_key) constraint means a
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
  const { error } = await supabase
    .from("wc_challenge_completions")
    .insert({
      user_id: userId,
      week_key: weekKey,
      product,
      duration_ms: Math.max(0, Math.round(durationMs)),
      mistakes: Math.max(0, Math.round(mistakes)),
    });

  if (!error) return { status: "awarded" };
  // 23505 = unique_violation → already earned this week.
  if (error.code === "23505") return { status: "already" };
  return { status: "error", message: error.message };
}
