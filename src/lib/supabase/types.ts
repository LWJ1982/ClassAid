/**
 * Supabase Database Type Definitions
 * Matches the PostgreSQL schema in supabase/migrations/0001_initial_schema.sql
 * Compatible with @supabase/supabase-js v2.112+ GenericSchema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'learner' | 'instructor' | 'admin';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role: 'learner' | 'instructor' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'learner' | 'instructor' | 'admin';
          created_at?: string;
        };
        Relationships: [];
      };
      domains: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          compliance_label: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          compliance_label: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          compliance_label?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      modules: {
        Row: {
          id: string;
          domain_id: string;
          title: string;
          description: string | null;
          owner_id: string;
          status: 'draft' | 'published' | 'archived';
          version: string;
          overall_threshold: number;
          estimated_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          title: string;
          description?: string | null;
          owner_id: string;
          status?: 'draft' | 'published' | 'archived';
          version?: string;
          overall_threshold?: number;
          estimated_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string;
          title?: string;
          description?: string | null;
          owner_id?: string;
          status?: 'draft' | 'published' | 'archived';
          version?: string;
          overall_threshold?: number;
          estimated_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'modules_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'domains';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'modules_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      competencies: {
        Row: {
          id: string;
          module_id: string;
          name: string;
          description: string | null;
          weight: number;
          min_threshold: number;
          mandatory: boolean;
          critical: boolean;
          sequence: number;
        };
        Insert: {
          id?: string;
          module_id: string;
          name: string;
          description?: string | null;
          weight?: number;
          min_threshold?: number;
          mandatory?: boolean;
          critical?: boolean;
          sequence?: number;
        };
        Update: {
          id?: string;
          module_id?: string;
          name?: string;
          description?: string | null;
          weight?: number;
          min_threshold?: number;
          mandatory?: boolean;
          critical?: boolean;
          sequence?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'competencies_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          },
        ];
      };
      activities: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          activity_type: 'instruction' | 'demonstration' | 'warning' | 'practice' | 'reflection';
          sequence: number;
          content: string;
          explanation: string | null;
          warning: string | null;
          competency_id: string | null;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          activity_type?: 'instruction' | 'demonstration' | 'warning' | 'practice' | 'reflection';
          sequence: number;
          content: string;
          explanation?: string | null;
          warning?: string | null;
          competency_id?: string | null;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string;
          activity_type?: 'instruction' | 'demonstration' | 'warning' | 'practice' | 'reflection';
          sequence?: number;
          content?: string;
          explanation?: string | null;
          warning?: string | null;
          competency_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'activities_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activities_competency_id_fkey';
            columns: ['competency_id'];
            isOneToOne: false;
            referencedRelation: 'competencies';
            referencedColumns: ['id'];
          },
        ];
      };
      questions: {
        Row: {
          id: string;
          module_id: string;
          competency_id: string | null;
          question_text: string;
          question_type: 'multiple-choice' | 'true-false';
          options: Json;
          correct_answer: string;
          explanation: string | null;
          critical: boolean;
          source_reference: string | null;
          question_kind: 'assessment' | 'checkpoint';
          activity_id: string | null;
          approval_status: 'auto_generated' | 'approved' | 'rejected' | 'edited';
          failure_hint: string | null;
          min_read_seconds: number | null;
          generated_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          competency_id?: string | null;
          question_text: string;
          question_type?: 'multiple-choice' | 'true-false';
          options: Json;
          correct_answer: string;
          explanation?: string | null;
          critical?: boolean;
          source_reference?: string | null;
          question_kind?: 'assessment' | 'checkpoint';
          activity_id?: string | null;
          approval_status?: 'auto_generated' | 'approved' | 'rejected' | 'edited';
          failure_hint?: string | null;
          min_read_seconds?: number | null;
          generated_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          competency_id?: string | null;
          question_text?: string;
          question_type?: 'multiple-choice' | 'true-false';
          options?: Json;
          correct_answer?: string;
          explanation?: string | null;
          critical?: boolean;
          source_reference?: string | null;
          question_kind?: 'assessment' | 'checkpoint';
          activity_id?: string | null;
          approval_status?: 'auto_generated' | 'approved' | 'rejected' | 'edited';
          failure_hint?: string | null;
          min_read_seconds?: number | null;
          generated_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'questions_competency_id_fkey';
            columns: ['competency_id'];
            isOneToOne: false;
            referencedRelation: 'competencies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'questions_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'activities';
            referencedColumns: ['id'];
          },
        ];
      };
      sources: {
        Row: {
          id: string;
          module_id: string;
          filename: string;
          storage_path: string;
          content_type: string | null;
          file_size: number | null;
          chunk_count: number | null;
          status: 'uploaded' | 'processing' | 'indexed' | 'failed';
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          filename: string;
          storage_path: string;
          content_type?: string | null;
          file_size?: number | null;
          chunk_count?: number | null;
          status?: 'uploaded' | 'processing' | 'indexed' | 'failed';
          uploaded_by: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          filename?: string;
          storage_path?: string;
          content_type?: string | null;
          file_size?: number | null;
          chunk_count?: number | null;
          status?: 'uploaded' | 'processing' | 'indexed' | 'failed';
          uploaded_by?: string;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sources_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          },
        ];
      };
      source_chunks: {
        Row: {
          id: string;
          source_id: string;
          module_id: string;
          chunk_index: number;
          content: string;
          page: number | null;
          section: string | null;
          embedding: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          module_id: string;
          chunk_index: number;
          content: string;
          page?: number | null;
          section?: string | null;
          embedding?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          module_id?: string;
          chunk_index?: number;
          content?: string;
          page?: number | null;
          section?: string | null;
          embedding?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'source_chunks_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'source_chunks_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          },
        ];
      };
      attempts: {
        Row: {
          id: string;
          learner_id: string;
          module_id: string;
          module_version: string;
          started_at: string;
          submitted_at: string | null;
          status: 'in_progress' | 'submitted' | 'scored';
          overall_score: number | null;
        };
        Insert: {
          id?: string;
          learner_id: string;
          module_id: string;
          module_version: string;
          started_at?: string;
          submitted_at?: string | null;
          status?: 'in_progress' | 'submitted' | 'scored';
          overall_score?: number | null;
        };
        Update: {
          id?: string;
          learner_id?: string;
          module_id?: string;
          module_version?: string;
          started_at?: string;
          submitted_at?: string | null;
          status?: 'in_progress' | 'submitted' | 'scored';
          overall_score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'attempts_learner_id_fkey';
            columns: ['learner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attempts_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          },
        ];
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_answer: string;
          is_correct: boolean;
          is_critical_failure: boolean;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_answer: string;
          is_correct?: boolean;
          is_critical_failure?: boolean;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_answer?: string;
          is_correct?: boolean;
          is_critical_failure?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'attempt_answers_attempt_id_fkey';
            columns: ['attempt_id'];
            isOneToOne: false;
            referencedRelation: 'attempts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attempt_answers_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
        ];
      };
      results: {
        Row: {
          id: string;
          attempt_id: string;
          overall_score: number;
          status: 'READY' | 'REVIEW_REQUIRED' | 'FURTHER_PREPARATION' | 'ESCALATE';
          competency_scores: Json;
          critical_failures: Json | null;
          strengths: Json | null;
          review_areas: Json | null;
          remediation: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          overall_score: number;
          status: 'READY' | 'REVIEW_REQUIRED' | 'FURTHER_PREPARATION' | 'ESCALATE';
          competency_scores: Json;
          critical_failures?: Json | null;
          strengths?: Json | null;
          review_areas?: Json | null;
          remediation?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          overall_score?: number;
          status?: 'READY' | 'REVIEW_REQUIRED' | 'FURTHER_PREPARATION' | 'ESCALATE';
          competency_scores?: Json;
          critical_failures?: Json | null;
          strengths?: Json | null;
          review_areas?: Json | null;
          remediation?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'results_attempt_id_fkey';
            columns: ['attempt_id'];
            isOneToOne: false;
            referencedRelation: 'attempts';
            referencedColumns: ['id'];
          },
        ];
      };
      checkpoint_progress: {
        Row: {
          id: string;
          learner_id: string;
          module_id: string;
          activity_id: string;
          question_id: string | null;
          attempts: number;
          passed: boolean;
          first_attempt_correct: boolean;
          time_spent_seconds: number;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          learner_id: string;
          module_id: string;
          activity_id: string;
          question_id?: string | null;
          attempts?: number;
          passed?: boolean;
          first_attempt_correct?: boolean;
          time_spent_seconds?: number;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          learner_id?: string;
          module_id?: string;
          activity_id?: string;
          question_id?: string | null;
          attempts?: number;
          passed?: boolean;
          first_attempt_correct?: boolean;
          time_spent_seconds?: number;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'checkpoint_progress_learner_id_fkey';
            columns: ['learner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'checkpoint_progress_activity_id_fkey';
            columns: ['activity_id'];
            isOneToOne: false;
            referencedRelation: 'activities';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          learner_id: string;
          module_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          learner_id: string;
          module_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          learner_id?: string;
          module_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_learner_id_fkey';
            columns: ['learner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_module_id_fkey';
            columns: ['module_id'];
            isOneToOne: false;
            referencedRelation: 'modules';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          category: string | null;
          grounding: string | null;
          citations: Json | null;
          escalate: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          category?: string | null;
          grounding?: string | null;
          citations?: Json | null;
          escalate?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          category?: string | null;
          grounding?: string | null;
          citations?: Json | null;
          escalate?: boolean | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_events: {
        Row: {
          id: string;
          actor_id: string;
          actor_name: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          actor_name?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          actor_name?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_source_chunks: {
        Args: {
          query_embedding: string;
          match_threshold?: number;
          match_count?: number;
          filter_module_id?: string | null;
        };
        Returns: {
          id: string;
          source_id: string;
          module_id: string;
          content: string;
          section: string | null;
          chunk_index: number;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}
