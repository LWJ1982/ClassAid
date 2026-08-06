-- Class AId Row-Level Security Policies
-- Enforces access control per security.md steering file
-- Service role bypasses RLS automatically in Supabase

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS: Users can read their own row
-- ============================================================
CREATE POLICY "users_read_own"
  ON users FOR SELECT
  USING (id = auth.uid());

-- ============================================================
-- DOMAINS: Anyone authenticated can read domains
-- ============================================================
CREATE POLICY "domains_read_all"
  ON domains FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- MODULES: Anyone can read published modules; owner can CRUD
-- ============================================================
CREATE POLICY "modules_read_published"
  ON modules FOR SELECT
  USING (status = 'published' OR owner_id = auth.uid());

CREATE POLICY "modules_insert_owner"
  ON modules FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "modules_update_owner"
  ON modules FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "modules_delete_owner"
  ON modules FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- COMPETENCIES: Readable if module is published or user is owner
-- ============================================================
CREATE POLICY "competencies_read"
  ON competencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = competencies.module_id
        AND (modules.status = 'published' OR modules.owner_id = auth.uid())
    )
  );

CREATE POLICY "competencies_manage_owner"
  ON competencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = competencies.module_id
        AND modules.owner_id = auth.uid()
    )
  );

-- ============================================================
-- ACTIVITIES: Readable if module is published or user is owner
-- ============================================================
CREATE POLICY "activities_read"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = activities.module_id
        AND (modules.status = 'published' OR modules.owner_id = auth.uid())
    )
  );

CREATE POLICY "activities_manage_owner"
  ON activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = activities.module_id
        AND modules.owner_id = auth.uid()
    )
  );

-- ============================================================
-- QUESTIONS: Learners see only approved questions for published modules;
-- Instructors see all for owned modules
-- ============================================================
CREATE POLICY "questions_read_approved"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = questions.module_id
        AND (
          -- Instructor sees all questions for owned modules
          modules.owner_id = auth.uid()
          OR
          -- Learners see only approved questions for published modules
          (modules.status = 'published' AND questions.approval_status = 'approved')
        )
    )
  );

CREATE POLICY "questions_manage_owner"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = questions.module_id
        AND modules.owner_id = auth.uid()
    )
  );

-- ============================================================
-- SOURCES: Instructors who own the module can manage
-- ============================================================
CREATE POLICY "sources_read_owner"
  ON sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = sources.module_id
        AND modules.owner_id = auth.uid()
    )
  );

CREATE POLICY "sources_manage_owner"
  ON sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = sources.module_id
        AND modules.owner_id = auth.uid()
    )
  );

-- ============================================================
-- SOURCE_CHUNKS: Instructors who own the module can manage
-- ============================================================
CREATE POLICY "source_chunks_read_owner"
  ON source_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = source_chunks.module_id
        AND modules.owner_id = auth.uid()
    )
  );

CREATE POLICY "source_chunks_manage_owner"
  ON source_chunks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.id = source_chunks.module_id
        AND modules.owner_id = auth.uid()
    )
  );

-- ============================================================
-- ATTEMPTS: Learners read own; service role writes
-- ============================================================
CREATE POLICY "attempts_read_own"
  ON attempts FOR SELECT
  USING (learner_id = auth.uid());

CREATE POLICY "attempts_insert_own"
  ON attempts FOR INSERT
  WITH CHECK (learner_id = auth.uid());

-- ============================================================
-- ATTEMPT_ANSWERS: Learners read own; service role writes
-- ============================================================
CREATE POLICY "attempt_answers_read_own"
  ON attempt_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = attempt_answers.attempt_id
        AND attempts.learner_id = auth.uid()
    )
  );

-- ============================================================
-- RESULTS: Learners read own; service role writes
-- ============================================================
CREATE POLICY "results_read_own"
  ON results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM attempts
      WHERE attempts.id = results.attempt_id
        AND attempts.learner_id = auth.uid()
    )
  );

-- ============================================================
-- CHECKPOINT_PROGRESS: Learners read own
-- ============================================================
CREATE POLICY "checkpoint_progress_read_own"
  ON checkpoint_progress FOR SELECT
  USING (learner_id = auth.uid());

CREATE POLICY "checkpoint_progress_insert_own"
  ON checkpoint_progress FOR INSERT
  WITH CHECK (learner_id = auth.uid());

CREATE POLICY "checkpoint_progress_update_own"
  ON checkpoint_progress FOR UPDATE
  USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

-- ============================================================
-- CONVERSATIONS: Learners read own
-- ============================================================
CREATE POLICY "conversations_read_own"
  ON conversations FOR SELECT
  USING (learner_id = auth.uid());

CREATE POLICY "conversations_insert_own"
  ON conversations FOR INSERT
  WITH CHECK (learner_id = auth.uid());

-- ============================================================
-- MESSAGES: Learners read own conversations
-- ============================================================
CREATE POLICY "messages_read_own"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.learner_id = auth.uid()
    )
  );

-- ============================================================
-- AUDIT_EVENTS: Admins read all
-- ============================================================
CREATE POLICY "audit_events_read_admin"
  ON audit_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );
