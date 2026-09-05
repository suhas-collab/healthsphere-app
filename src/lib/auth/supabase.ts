import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for validating JWT tokens
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://kppkypqwwyrclbkkmdaa.supabase.co';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon_placeholder';

export const supabaseAuthServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
