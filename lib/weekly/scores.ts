import type { SupabaseClient } from "@supabase/supabase-js";

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  points: number;
  /** Average solve time across the user's wins, in ms (null if untimed). */
  avg_ms: number | null;
  last_completed: string | null;
}

/**
 * Top entries on the weekly-challenge leaderboard: most points first, ties broken
 * by fastest average solve time. The view only includes users who have scored.
 */
export async function fetchLeaderboard(
  supabase: SupabaseClient,
  limit = 50,
): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("wc_leaderboard")
    .select("user_id, display_name, points, avg_ms, last_completed")
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
): Promise<AwardResult> {
  const { error } = await supabase
    .from("wc_challenge_completions")
    .insert({
      user_id: userId,
      week_key: weekKey,
      product,
      duration_ms: Math.max(0, Math.round(durationMs)),
    });

  if (!error) return { status: "awarded" };
  // 23505 = unique_violation → already earned this week.
  if (error.code === "23505") return { status: "already" };
  return { status: "error", message: error.message };
}
