import { supabase } from '../supabaseClient'

/**
 * Copy a student's email to the clipboard and log it as a "connection".
 *
 * The old request/accept Connect feature was removed, so a recruiter copying a
 * student's contact is what now counts as a connection: each call writes one
 * row to wc_email_copies (the student's connection count + analytics funnel
 * source — see supabase/migrations/0012). The clipboard write is what the user
 * sees; the log is best-effort and never blocks the copy.
 *
 * @param {{ email: string, studentId: string, surface: 'explore_map' | 'sim_leaderboard' }} args
 * @returns {Promise<boolean>} whether the clipboard write succeeded
 */
export async function copyStudentEmail({ email, studentId, surface }) {
  let copied = false
  try {
    await navigator.clipboard.writeText(email)
    copied = true
  } catch {
    /* clipboard may be blocked (e.g. http / no permission) — still log below */
  }

  try {
    const { data } = await supabase.auth.getUser()
    const copierId = data.user?.id
    if (copierId && studentId) {
      await supabase
        .from('wc_email_copies')
        .insert({ copier_id: copierId, student_id: studentId, surface })
    }
  } catch {
    /* logging is best-effort; never surface an error for it */
  }

  return copied
}
