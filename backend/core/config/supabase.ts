import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Try to load env manually in script execution contexts
  try {
    const fs = require('fs');
    const path = require('path');
    const dotenvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(dotenvPath)) {
      const dotenvContent = fs.readFileSync(dotenvPath, 'utf8');
      dotenvContent.split('\n').forEach((line: string) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.substring(1, value.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    // Ignore loading errors in environments where fs is unavailable
  }
}

const finalSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const finalSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey);

export default supabase;
