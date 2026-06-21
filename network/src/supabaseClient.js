import { createClient } from '@supabase/supabase-js'

// Pulls from .env.local — see .env.example for the keys you need.
// Get these values from the Supabase dashboard: Project Settings > API.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
