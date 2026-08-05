-- Class AId D1 Schema
-- Initial migration: all core tables

-- Users (demo seeded, production: Cognito/Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Domains
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  compliance_label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Modules
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL REFERENCES domains(id),
  title TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version TEXT NOT NULL DEFAULT '0.1.0',
  overall_threshold REAL NOT NULL DEFAULT 0.8,
  estimated_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Competencies
CREATE TABLE IF NOT EXISTS competencies (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  weight REAL NOT NULL DEFAULT 0.25,
  min_threshold REAL NOT NULL DEFAULT 0.6,
  mandatory INTEGER NOT NULL DEFAULT 1,
  critical INTEGER NOT NULL DEFAULT 0,
  sequence INTEGER NOT NULL DEFAULT 0
);

-- Activities (guided learning steps)
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'instruction' CHECK (activity_type IN ('instruction', 'demonstration', 'warning', 'practice', 'reflection')),
  sequence INTEGER NOT NULL,
  content TEXT NOT NULL,
  explanation TEXT,
  warning TEXT,
  competency_id TEXT REFERENCES competencies(id)
);

-- Questions (assessment + checkpoint)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  competency_id TEXT REFERENCES competencies(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple-choice' CHECK (question_type IN ('multiple-choice', 'true-false')),
  options TEXT NOT NULL, -- JSON array
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  critical INTEGER NOT NULL DEFAULT 0,
  source_reference TEXT,
  -- Checkpoint-specific fields
  question_kind TEXT NOT NULL DEFAULT 'assessment' CHECK (question_kind IN ('assessment', 'checkpoint')),
  activity_id TEXT REFERENCES activities(id),
  approval_status TEXT NOT NULL DEFAULT 'auto_generated' CHECK (approval_status IN ('auto_generated', 'approved', 'rejected', 'edited')),
  failure_hint TEXT,
  min_read_seconds INTEGER DEFAULT 20,
  generated_at TEXT,
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Source documents (uploaded by instructor)
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  content_type TEXT,
  file_size INTEGER,
  chunk_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'indexed', 'failed')),
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Source chunks (for tracking what's in Vectorize)
CREATE TABLE IF NOT EXISTS source_chunks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id),
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  page INTEGER,
  section TEXT,
  vector_id TEXT, -- ID in Vectorize index
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Attempts (learner assessment submissions)
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES users(id),
  module_id TEXT NOT NULL REFERENCES modules(id),
  module_version TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'scored')),
  overall_score REAL
);

-- Attempt answers
CREATE TABLE IF NOT EXISTS attempt_answers (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  selected_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  is_critical_failure INTEGER NOT NULL DEFAULT 0
);

-- Readiness results
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id),
  overall_score REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('READY', 'REVIEW_REQUIRED', 'FURTHER_PREPARATION', 'ESCALATE')),
  competency_scores TEXT NOT NULL, -- JSON
  critical_failures TEXT, -- JSON array
  strengths TEXT, -- JSON array
  review_areas TEXT, -- JSON array
  remediation TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Checkpoint progress (learner step engagement)
CREATE TABLE IF NOT EXISTS checkpoint_progress (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES users(id),
  module_id TEXT NOT NULL REFERENCES modules(id),
  activity_id TEXT NOT NULL REFERENCES activities(id),
  question_id TEXT REFERENCES questions(id),
  attempts INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  first_attempt_correct INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES users(id),
  module_id TEXT NOT NULL REFERENCES modules(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  category TEXT,
  grounding TEXT,
  citations TEXT, -- JSON
  escalate INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit events
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_modules_owner ON modules(owner_id);
CREATE INDEX IF NOT EXISTS idx_modules_status ON modules(status);
CREATE INDEX IF NOT EXISTS idx_competencies_module ON competencies(module_id);
CREATE INDEX IF NOT EXISTS idx_activities_module ON activities(module_id, sequence);
CREATE INDEX IF NOT EXISTS idx_questions_module ON questions(module_id);
CREATE INDEX IF NOT EXISTS idx_questions_approval ON questions(module_id, approval_status, question_kind);
CREATE INDEX IF NOT EXISTS idx_sources_module ON sources(module_id);
CREATE INDEX IF NOT EXISTS idx_source_chunks_source ON source_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_attempts_learner ON attempts(learner_id, module_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_results_attempt ON results(attempt_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_progress_learner ON checkpoint_progress(learner_id, module_id);
CREATE INDEX IF NOT EXISTS idx_conversations_learner ON conversations(learner_id, module_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events(entity_type, entity_id);
