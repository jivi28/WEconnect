import type { SupabaseClient } from "@supabase/supabase-js";
import type { SimulationData } from "@/lib/types";

/**
 * Per-account simulator progress + "My Library". One row is written to
 * wc_simulation_completions each time the user finishes a build (guided,
 * weekly challenge, or free build). The same rows power both the top-bar
 * counter and the start-screen library. See migrations 0006 + 0007.
 *
 * Helpers degrade gracefully (return 0 / [] / false) if the table/columns
 * aren't there or the user is signed out, so the UI never crashes when the
 * migration hasn't been run yet.
 */

export type SimulationMode = "guided" | "challenge" | "free";

/** What we store to reopen a build later. */
export type SavedBuildData =
  | SimulationData // guided / challenge
  | { componentIds: string[] }; // free build

export interface SavedSimulation {
  id: string;
  product: string | null;
  mode: SimulationMode;
  title: string;
  created_at: string;
  data: SavedBuildData | null;
}

interface RecordInput {
  product: string | null;
  mode: SimulationMode;
  title: string;
  data: SavedBuildData | null;
}

/** How many simulations this user has completed (0 on any error). */
export async function fetchSimulationCount(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("wc_simulation_completions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}

/** This user's saved builds, newest first ([] on any error). */
export async function fetchLibrary(
  supabase: SupabaseClient,
  userId: string,
  limit = 100,
): Promise<SavedSimulation[]> {
  const { data, error } = await supabase
    .from("wc_simulation_completions")
    .select("id, product, mode, title, created_at, data")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as SavedSimulation[];
}

/** Record one completed simulation (also saves it to the library). */
export async function recordSimulationCompletion(
  supabase: SupabaseClient,
  userId: string,
  input: RecordInput,
): Promise<boolean> {
  const { error } = await supabase.from("wc_simulation_completions").insert({
    user_id: userId,
    product: input.product,
    mode: input.mode,
    title: input.title,
    data: input.data,
  });

  return !error;
}
