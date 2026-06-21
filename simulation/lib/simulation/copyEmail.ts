import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Copy a student's email to the clipboard and log it as a "connection".
 *
 * The old request/accept Connect feature was removed, so a recruiter copying a
 * student's contact from the leaderboard is what now counts as a connection:
 * each call writes one row to wc_email_copies (the student's connection count +
 * the analytics engagement-funnel source — see supabase/migrations/0012). The
 * clipboard write is what the user sees; the log is best-effort.
 */
export async function copyStudentEmail(
  supabase: SupabaseClient,
  copierId: string,
  args: { email: string; studentId: string },
): Promise<boolean> {
  let copied = false;
  try {
    await navigator.clipboard.writeText(args.email);
    copied = true;
  } catch {
    /* clipboard may be blocked — still log below */
  }

  try {
    await supabase.from("wc_email_copies").insert({
      copier_id: copierId,
      student_id: args.studentId,
      surface: "sim_leaderboard",
    });
  } catch {
    /* logging is best-effort */
  }

  return copied;
}
