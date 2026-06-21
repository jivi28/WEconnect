// Re-exports the app's single Supabase client (src/supabaseClient.js) instead
// of creating a second one — two GoTrueClient instances against the same
// storage key fight over the session and log "Multiple GoTrueClient
// instances detected" warnings.
export { supabase } from '../supabaseClient'
export const SLIDES_BUCKET = 'event-slides'
