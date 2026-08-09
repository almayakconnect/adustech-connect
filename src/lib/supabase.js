import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sxwblaveefqeghfyluwo.supabase.co'

const supabasePublishableKey =
  'sb_publishable_ir3oHviMg2WMokQbeaeQVQ_vAbggIHg'

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)
