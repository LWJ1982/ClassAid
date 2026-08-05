# Coding Standards

## Language and configuration
- TypeScript strict mode (noEmit, strict: true)
- Next.js 15.5.2 with static export (output: 'export')
- React 18 (not 19 — peer dependency constraint)
- Tailwind CSS for styling
- Zod for runtime validation

## Code organisation
- Prefer pure functions and explicit types
- Small, focused modules (one concern per file)
- Domain logic outside React components (in `src/lib/`)
- UI components in `src/components/` grouped by role (learner/, instructor/, admin/)
- API routes in `functions/` directory (Cloudflare Pages Functions)
- Shared types in `src/lib/domain/types.ts`
- Readiness engine in `src/lib/engine/`

## Do not
- Put scoring logic in UI components
- Call Groq or Supabase service-role from client components
- Expose service-role credentials to the browser
- Introduce unnecessary dependencies
- Duplicate type definitions
- Use `any` without justification
- Hide errors silently
- Hardcode discipline-specific logic (keep cross-domain)

## Interfaces
Every external integration must have a typed interface:
- `GroqClient` (question generation, chat responses)
- `EmbeddingClient` (Workers AI BGE-base)
- `ModuleRepository` (Supabase queries)
- `AssessmentRepository` (attempts, answers, results)
- `VectorSearchClient` (pgvector queries)

## Naming conventions
- PascalCase for types, interfaces, components
- camelCase for functions, variables, instances
- kebab-case for file names
- UPPER_SNAKE_CASE for environment variables
- Descriptive names — no abbreviations except well-known (ID, URL, API)

## Error handling
- Use typed error responses from API routes
- Map provider errors to application-level error types
- Show actionable user-facing messages (no stack traces, no internals)
- Log errors server-side with context (no secrets in logs)

## Client state
- Use React Context for app-wide state (role, module config)
- localStorage for persistence (fallback when Supabase unavailable)
- Optimistic UI where appropriate (show loading, handle failure)
