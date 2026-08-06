/**
 * JWT validation helper for Pages Functions
 * Extracts user identity from the Authorization Bearer token.
 * Falls back to body-provided fields in demo mode (no token present).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type Role = 'learner' | 'instructor' | 'admin';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role: Role;
  isDemoMode: boolean;
}

/**
 * Infer role from a demo-mode fallback user ID.
 * Convention: IDs starting with 'user-instructor' map to instructor,
 * IDs starting with 'user-admin' map to admin, otherwise learner.
 */
function inferRoleFromFallbackId(fallbackUserId: string): Role {
  if (fallbackUserId.startsWith('user-instructor')) {
    return 'instructor';
  }
  if (fallbackUserId.startsWith('user-admin')) {
    return 'admin';
  }
  return 'learner';
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

    const metadataRole = data.user.user_metadata?.role as string | undefined;
    const role: Role =
      metadataRole === 'instructor' || metadataRole === 'admin'
        ? metadataRole
        : 'learner';

    return {
      id: data.user.id,
      email: data.user.email,
      role,
      isDemoMode: false,
    };
  }

  // No token present - demo mode fallback
  if (fallbackUserId) {
    return {
      id: fallbackUserId,
      role: inferRoleFromFallbackId(fallbackUserId),
      isDemoMode: true,
    };
  }

  return null;
}

/**
 * Checks whether the user has one of the allowed roles.
 * Returns true if the user's role is in the allowed set.
 */
export function requireRole(user: AuthenticatedUser, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(user.role);
}
