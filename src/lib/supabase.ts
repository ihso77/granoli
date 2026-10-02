import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pddztwfnwnubaztrwlss.supabase.co'
const SUPABASE_KEY = 'sb_publishable_JXi6qcniYgiZ72TGgB2xcA_YIbOuZUD'

export const supabaseUrl = SUPABASE_URL
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)