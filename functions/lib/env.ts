/**
 * Shared environment interface for Cloudflare Pages Functions
 * Includes Supabase, Groq, and Workers AI (embeddings only) bindings
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GROQ_API_KEY: string;
  AI: Ai;
}
