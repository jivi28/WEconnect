// Formats a Supabase `date` value (YYYY-MM-DD) as dd/mm/yyyy.
// Parses the string directly (no `new Date()`) so the day never shifts due to
// timezone offsets. Returns '' for null/empty/unrecognized input.
export function formatDate(iso) {
  if (!iso) return ''
  const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ''
  const [, y, mo, d] = m
  return `${d}/${mo}/${y}`
}
