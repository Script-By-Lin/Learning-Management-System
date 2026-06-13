import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'WARNING: Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
