# AI System Boundaries

## AI (Groq / Workers AI) may
- Generate questions from uploaded source content (structured JSON output).
- Retrieve and summarise approved content for learner queries.
- Explain foundational concepts and approved procedures.
- Provide hints and source references with citations.
- Suggest remediation wording and misconception categories.
- Recommend instructor escalation when evidence is insufficient.
- Classify learner questions (CONCEPT, PROCEDURE, COMPLIANCE, TROUBLESHOOTING, APPLICATION, OUT_OF_SCOPE).

## AI must not
- Determine whether an answer is correct.
- Determine or change final readiness status or score.
- Override a critical failure.
- Reveal direct answers to active assessments.
- Publish content or grant permissions.
- Claim that a learner is safe or practically competent.
- Invent policies, procedures, limits or citations.

## Grounding rule
Use only retrieved approved content (from pgvector search). When evidence is insufficient, return:
"The approved material for this module does not provide enough information to answer this reliably. Review the listed module material or consult the responsible instructor."

## Citation requirement
Every AI coach response must include citations from the chunk metadata used to generate it. Citations include: source title, section, page number (if available), and relevance score. Citations come from retrieval metadata — NOT from LLM output (guaranteed accurate).

## Grounding levels
- SUPPORTED: Average retrieval score > 0.75
- PARTIAL: Average retrieval score 0.6–0.75
- INSUFFICIENT: Average retrieval score < 0.6 (trigger escalation)

## Assessment-help rule
Do not reveal answers. Provide a hint, explain the underlying concept and direct the learner to the source section.

## Critical-risk rule
For serious safety, compliance, or responsible-practice uncertainty: advise the learner to stop, consult the responsible instructor, and set escalation to true.

## Question generation output format
AI must return valid JSON with: questionText, options (array of 4), correctAnswer (exact match to one option), explanation, failureHint. Invalid output is discarded (not shown to instructor).
