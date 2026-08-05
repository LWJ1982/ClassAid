# Architecture Context

## Stack (Zero Budget — All Free Tier)
- Next.js 15.5.2 (App Router, static export)
- TypeScript strict mode
- Tailwind CSS, React 18
- Supabase Free (PostgreSQL + pgvector + Auth + Storage)
- Groq Free (Llama 3.1 70B for generation)
- Cloudflare Workers AI (BGE-base-en-v1.5 for embeddings)
- Cloudflare Pages (hosting + Pages Functions for API)
- Zod for validation

## Architecture rules
- The browser communicates only with Cloudflare Pages Functions (API routes).
- The browser must not call Groq, Workers AI, or Supabase service-role directly.
- The browser must not receive API keys, service-role keys, or correct answer keys.
- Static export to `out/` directory; API routes in `functions/` directory.

## Component responsibilities

### Next.js (frontend) owns
Application pages, user interfaces, client-side state, navigation, role-aware views, loading/error/empty states.

### Cloudflare Pages Functions own
API routes, validation, Groq calls, Workers AI calls, Supabase service-role operations, deterministic scoring, error handling.

### Groq (Llama 3.1 70B) owns
Question generation (structured JSON output), RAG response generation, remediation wording, conversational coaching.

### Cloudflare Workers AI owns
Document chunk embeddings (BGE-base-en-v1.5, 768 dimensions).

### Supabase owns
PostgreSQL database (modules, questions, attempts, results, audit), pgvector (embeddings + similarity search), Auth (users, roles, sessions), Storage (uploaded source files).

## Groq must not
- Determine whether an answer is correct.
- Determine or change readiness status or score.
- Override a critical failure.
- Reveal direct answers to active assessments.

## Required property
Assessment and readiness reporting must continue to work when Groq is unavailable (fallback to deterministic-only report).

## Future migration path
When budget is available, migrate to AWS: Aurora Serverless v2 + Bedrock (Claude 3.5) + CloudFront + Lambda + Cognito. Application code structure stays identical — only infrastructure bindings change.
