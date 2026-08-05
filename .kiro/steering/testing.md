# Testing Standards

## Tools
- Vitest for unit tests
- Playwright for end-to-end tests (when needed)
- Mock Groq/Workers AI responses for deterministic testing
- Isolated Supabase test data (or local mock)

## Required unit tests

### Readiness engine
- Perfect score → READY
- Zero score → FURTHER_PREPARATION
- Exact threshold (80%) → READY
- One point below threshold (79%) → REVIEW_REQUIRED
- High score with critical failure → REVIEW_REQUIRED (not READY)
- Multiple critical failures → REVIEW_REQUIRED
- Mandatory competency below threshold → not READY
- Incomplete attempt → rejected (error thrown)
- Unknown/duplicate question IDs → rejected
- Invalid competency weights → handled gracefully
- Deterministic repeat execution (same input = same output)

### Question generation
- Valid JSON output → parsed and stored
- Malformed JSON → discarded, not stored
- Missing required fields → discarded
- Correct answer not in options → discarded
- Question stored as 'auto_generated' (not 'approved')

### Input validation
- Empty/whitespace messages → rejected
- Oversized messages (>2000 chars) → rejected
- Missing required fields → 400 error
- Altered question IDs in assessment → rejected
- Browser-supplied scores → ignored/rejected

## Required integration tests
- File upload → chunks created → embeddings stored
- RAG query → relevant chunks returned → grounded response generated
- Assessment submission → scoring → result persistence
- Checkpoint approval → status updated → visible to learner
- Instructor threshold change → affects next assessment scoring

## Definition of done
- Acceptance criteria met
- Relevant tests pass
- TypeScript type-check passes (npx tsc --noEmit)
- ESLint passes
- Loading, empty, and error states handled
- No secrets exposed to client
- Works in fallback mode (without Groq/Supabase)
