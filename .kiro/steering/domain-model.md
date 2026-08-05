# Domain Model

The platform must remain cross-domain. Do not hard-code assumptions that every module is a physical lab, engineering experiment, or safety-related.

Use configurable terminology and module-specific competency models.

## Core entities
Domain, Module, Competency, Activity, Question (assessment + checkpoint), Source, SourceChunk, Attempt, AttemptAnswer, Result, Conversation, Message, AuditEvent, User.

## Readiness statuses
- READY — All mandatory thresholds met; no critical failure
- REVIEW_REQUIRED — Overall close to threshold, competency gap, or critical error
- FURTHER_PREPARATION — Multiple gaps or low score
- ESCALATE — Outside approved evidence; high-risk uncertainty

Status names must not imply certification of practical competence.

## Question kinds
- `assessment` — Final readiness assessment questions (scored for competency + status)
- `checkpoint` — Comprehension gates during guided activity (must pass to proceed)

## Approval statuses
- `auto_generated` — AI created, pending instructor review
- `approved` — Instructor approved, visible to learners
- `rejected` — Instructor rejected, not visible
- `edited` — Instructor modified after generation

## Key schema tables (Supabase PostgreSQL)
- users (id, name, email, role)
- domains (id, name, compliance_label)
- modules (id, domain_id, title, owner_id, status, version, overall_threshold)
- competencies (id, module_id, name, weight, min_threshold, mandatory, critical)
- activities (id, module_id, title, type, sequence, content, warning, competency_id)
- questions (id, module_id, competency_id, question_text, options, correct_answer, critical, question_kind, activity_id, approval_status, failure_hint, min_read_seconds)
- sources (id, module_id, filename, storage_path, chunk_count, status)
- source_chunks (id, source_id, module_id, content, section, embedding vector(768))
- attempts (id, learner_id, module_id, module_version, status, overall_score)
- attempt_answers (id, attempt_id, question_id, selected_answer, is_correct, is_critical_failure)
- results (id, attempt_id, overall_score, status, competency_scores, critical_failures, remediation)
- conversations (id, learner_id, module_id)
- messages (id, conversation_id, role, content, category, grounding, citations, escalate)
- audit_events (id, actor_id, action, entity_type, entity_id, details, created_at)
- checkpoint_progress (id, learner_id, activity_id, attempts, passed, time_spent_seconds)
