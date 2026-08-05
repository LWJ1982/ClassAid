-- Class AId Supabase PostgreSQL Schema
-- Converted from D1/SQLite to PostgreSQL with pgvector support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (demo seeded, production: Supabase Auth)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('learner', 'instructor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Domains
CREATE TABLE domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  compliance_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Modules
CREATE TABLE modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id),
  title text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version text NOT NULL DEFAULT '0.1.0',
  overall_threshold real NOT NULL DEFAULT 0.8,
  estimated_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Competencies
CREATE TABLE competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  weight real NOT NULL DEFAULT 0.25,
  min_threshold real NOT NULL DEFAULT 0.6,
  mandatory boolean NOT NULL DEFAULT true,
  critical boolean NOT NULL DEFAULT false,
  sequence integer NOT NULL DEFAULT 0
);

-- Activities (guided learning steps)
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  activity_type text NOT NULL DEFAULT 'instruction' CHECK (activity_type IN ('instruction', 'demonstration', 'warning', 'practice', 'reflection')),
  sequence integer NOT NULL,
  content text NOT NULL,
  explanation text,
  warning text,
  competency_id uuid REFERENCES competencies(id)
);

-- Questions (assessment + checkpoint)
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  competency_id uuid REFERENCES competencies(id),
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple-choice' CHECK (question_type IN ('multiple-choice', 'true-false')),
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text,
  critical boolean NOT NULL DEFAULT false,
  source_reference text,
  -- Checkpoint-specific fields
  question_kind text NOT NULL DEFAULT 'assessment' CHECK (question_kind IN ('assessment', 'checkpoint')),
  activity_id uuid REFERENCES activities(id),
  approval_status text NOT NULL DEFAULT 'auto_generated' CHECK (approval_status IN ('auto_generated', 'approved', 'rejected', 'edited')),
  failure_hint text,
  min_read_seconds integer DEFAULT 20,
  generated_at timestamptz,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Source documents (uploaded by instructor)
CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  content_type text,
  file_size integer,
  chunk_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'indexed', 'failed')),
  uploaded_by uuid NOT NULL REFERENCES users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Source chunks (for embeddings via pgvector)
CREATE TABLE source_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id),
  chunk_index integer NOT NULL,
  content text NOT NULL,
  page integer,
  section text,
  embedding vector(768),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Attempts (learner assessment submissions)
CREATE TABLE attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES users(id),
  module_id uuid NOT NULL REFERENCES modules(id),
  module_version text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'scored')),
  overall_score real
);

-- Attempt answers
CREATE TABLE attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id),
  selected_answer text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  is_critical_failure boolean NOT NULL DEFAULT false
);

-- Readiness results
CREATE TABLE results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES attempts(id),
  overall_score real NOT NULL,
  status text NOT NULL CHECK (status IN ('READY', 'REVIEW_REQUIRED', 'FURTHER_PREPARATION', 'ESCALATE')),
  competency_scores jsonb NOT NULL,
  critical_failures jsonb,
  strengths jsonb,
  review_areas jsonb,
  remediation jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Checkpoint progress (learner step engagement)
CREATE TABLE checkpoint_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES users(id),
  module_id uuid NOT NULL REFERENCES modules(id),
  activity_id uuid NOT NULL REFERENCES activities(id),
  question_id uuid REFERENCES questions(id),
  attempts integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  first_attempt_correct boolean NOT NULL DEFAULT false,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz
);

-- Chat conversations
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES users(id),
  module_id uuid NOT NULL REFERENCES modules(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Chat messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  category text,
  grounding text,
  citations jsonb,
  escalate boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit events
CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  actor_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_modules_owner ON modules(owner_id);
CREATE INDEX idx_modules_status ON modules(status);
CREATE INDEX idx_competencies_module ON competencies(module_id);
CREATE INDEX idx_activities_module ON activities(module_id, sequence);
CREATE INDEX idx_questions_module ON questions(module_id);
CREATE INDEX idx_questions_approval ON questions(module_id, approval_status, question_kind);
CREATE INDEX idx_sources_module ON sources(module_id);
CREATE INDEX idx_source_chunks_source ON source_chunks(source_id);
CREATE INDEX idx_source_chunks_module ON source_chunks(module_id);
CREATE INDEX idx_attempts_learner ON attempts(learner_id, module_id);
CREATE INDEX idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX idx_results_attempt ON results(attempt_id);
CREATE INDEX idx_checkpoint_progress_learner ON checkpoint_progress(learner_id, module_id);
CREATE INDEX idx_conversations_learner ON conversations(learner_id, module_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id);

-- Vector similarity search index (IVFFlat for performance)
CREATE INDEX idx_source_chunks_embedding ON source_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
