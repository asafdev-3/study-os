// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || SUPABASE_URL.includes('SEU_PROJECT_ID')) {
  console.warn(
    '[StudyOS] Supabase não configurado.\n' +
    'Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local'
  )
}

export const supabase = createClient(
  SUPABASE_URL  || 'https://placeholder.supabase.co',
  SUPABASE_ANON || 'placeholder-anon-key'
)
