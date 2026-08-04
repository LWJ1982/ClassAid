/**
 * Environment validation
 * In prototype mode, all external services are optional.
 * The app runs fully with mocked data when no env vars are set.
 */

export interface EnvConfig {
  // Public
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  // Server-only (never exposed to browser)
  supabaseServiceRole: string | null;
  difyCoachKey: string | null;
  difyRemediationKey: string | null;
  difyBaseUrl: string | null;
  // Mode
  isPrototypeMode: boolean;
}

export function getEnvConfig(): EnvConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
  const difyCoachKey = process.env.DIFY_COACH_APP_API_KEY ?? null;
  const difyRemediationKey = process.env.DIFY_REMEDIATION_APP_API_KEY ?? null;
  const difyBaseUrl = process.env.DIFY_BASE_URL ?? null;

  // Prototype mode = no external services configured
  const isPrototypeMode = !supabaseUrl && !difyCoachKey;

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRole,
    difyCoachKey,
    difyRemediationKey,
    difyBaseUrl,
    isPrototypeMode,
  };
}

/**
 * Validate that secrets are not accidentally exposed
 */
export function validateSecrets(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check no secret uses NEXT_PUBLIC_ prefix
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY must not use NEXT_PUBLIC_ prefix");
  }
  if (process.env.NEXT_PUBLIC_DIFY_COACH_APP_API_KEY) {
    errors.push("DIFY_COACH_APP_API_KEY must not use NEXT_PUBLIC_ prefix");
  }
  if (process.env.NEXT_PUBLIC_DIFY_REMEDIATION_APP_API_KEY) {
    errors.push("DIFY_REMEDIATION_APP_API_KEY must not use NEXT_PUBLIC_ prefix");
  }

  return { valid: errors.length === 0, errors };
}
