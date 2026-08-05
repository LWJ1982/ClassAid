# Security Requirements

## Secrets
- GROQ_API_KEY — server-side only (Pages Functions environment variable)
- SUPABASE_SERVICE_ROLE_KEY — server-side only (never in client code)
- SUPABASE_URL and SUPABASE_ANON_KEY — safe for client (read-only with RLS)
- Never prefix a secret with NEXT_PUBLIC_ unless it is genuinely public

## Input validation
- Validate module IDs, attempt IDs, learner messages, answers, roles with Zod
- Limit learner message length to 2000 characters
- Limit file upload size to 10MB
- Reject malformed, unexpected, and duplicate fields

## Access control
- Learners cannot access correct answers before submission
- Learners cannot access another learner's attempts or results
- Learners cannot access unpublished modules or instructor analytics
- Instructors may only access owned or authorised modules
- All scoring happens server-side — browser cannot submit scores or status

## Data handling
- Do not log API keys, service-role tokens, or unnecessary personal information
- Store attempt evidence and necessary identifiers only
- Audit trail is append-only (records cannot be modified or deleted)

## Generated content
- Treat AI output as untrusted
- Render safely — never execute generated HTML or scripts
- Validate AI structured output before storing (discard malformed)

## Row-Level Security (Supabase)
- Learners can only read their own attempts, results, and conversations
- Learners can only read published modules and approved questions
- Instructors can read/write modules they own
- Service role used only in Pages Functions (server-side)

## Assessment integrity
- Correct answers never sent to browser before submission
- Scoring computed server-side from authoritative database records
- Critical-rule override is deterministic code, not AI-influenced
- Duplicate submissions rejected (idempotency)
- Altered or unknown question IDs rejected
