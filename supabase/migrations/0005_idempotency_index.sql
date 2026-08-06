-- Partial unique index to prevent duplicate scored attempts
-- for the same learner, module, and module version.
-- This makes the idempotency check atomic at the database level,
-- closing the TOCTOU window in the application-layer check.
CREATE UNIQUE INDEX idx_attempts_idempotency 
ON attempts(learner_id, module_id, module_version) 
WHERE status = 'scored';
