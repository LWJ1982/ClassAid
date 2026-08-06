/**
 * Supabase service-role client factory for Pages Functions
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/lib/supabase/types';
import type { Env } from './env';

/**
 * Creates a Supabase client with service-role privileges.
 * Must only be used in server-side Pages Functions.
 */
export function createSupabaseClient(env: Env): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
