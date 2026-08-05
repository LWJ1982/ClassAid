/**
 * JWT validation helper for Pages Functions
 * Extracts user identity from the Authorization Bearer token.
 * Falls back to body-provided fields in demo mode (no token present).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  isDemoMode: boolean;
}

/**
 * Extracts and verifies user identity from the request.
 * If a Bearer token is present, validates it via Supabase Auth.
 * If no token is present (demo mode), falls back to the provided fallbackUserId.
 *
 * Returns null if a token is present but invalid (caller should return 401).
 */
export async function extractUser(
  request: Request,
  supabase: SupabaseClient,
  fallbackUserId?: string
): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();

    if (!token) {
      return null;
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      isDemoMode: false,
    };
  }

  // No token present - demo mode fallback
  if (fallbackUserId) {
    return {
      id: fallbackUserId,
      isDemoMode: true,
    };
  }

  return null;
}
