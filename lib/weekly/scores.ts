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
  /** Public handle — the only identity students ever see. */
  username: string;
  /** 'student' | 'educator' | 'wurth_employee'. */
  role: string;
  points: number;
  /** Average solve time across the user's wins, in ms (null if untimed). */
  avg_ms: number | null;
  /** Total wrong placements across all the user's solves. */
  total_mistakes: number;
  /** Average wrong placements per solve. */
  avg_mistakes: number;
  last_completed: string | null;
}

/** Which players the board shows: just students, or everyone (incl. educators/employees). */
export type LeaderboardScope = "students" | "all";

/**
 * Top entries on the weekly-challenge leaderboard: most points first (points
 * already fold in speed + mistakes via scoreFor), ties broken by fastest average
 * solve time. The view exposes only username + role + stats — never name/email —
 * so students see usernames only. The `students` scope filters to role='student'.
 */
export async function fetchLeaderboard(
  supabase: SupabaseClient,
  scope: LeaderboardScope = "students",
  limit = 50,
): Promise<LeaderboardRow[]> {
  let query = supabase
    .from("wc_leaderboard")
    .select(
      "user_id, username, role, points, avg_ms, total_mistakes, avg_mistakes, last_completed",
    );
  if (scope === "students") query = query.eq("role", "student");

  const { data, error } = await query
    .order("points", { ascending: false })
    .order("avg_ms", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as LeaderboardRow[];
}

export interface ContactInfo {
  name: string | null;
  email: string | null;
}

/**
 * Name + email for the given players, keyed by user id. The wc_student_contact
 * RPC is server-gated: it returns rows ONLY when the caller is a wurth_employee,
 * so this is empty for students/educators/anon (no PII leak). Safe to call from
 * the board; we only invoke it when the viewer is an employee.
 */
export async function fetchContacts(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Map<string, ContactInfo>> {
  const out = new Map<string, ContactInfo>();
  if (userIds.length === 0) return out;
  const { data, error } = await supabase.rpc("wc_student_contact", {
    target_ids: userIds,
  });
  if (error) return out; // gated / transient → no enrichment
  for (const row of (data ?? []) as Array<{
    id: string;
    name: string | null;
    email: string | null;
  }>) {
    out.set(row.id, { name: row.name, email: row.email });
  }
  return out;
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
