/**
 * Server-side Supabase client for Cloudflare Pages Functions
 * Uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (never exposed to browser)
 * Service role bypasses RLS for server-side operations
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export interface ServiceClientEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Creates a server-side Supabase client with service role privileges.
 * Must only be called from Pages Functions (server-side).
 * The service role key bypasses RLS for administrative operations.
 */
export function createServiceClient(env: ServiceClientEnv): SupabaseClient<Database> {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
