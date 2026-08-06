// Class AId Domain Types
// Cross-domain configurable — no hardcoded discipline logic

export type Role = 'learner' | 'instructor' | 'admin';

export type ReadinessStatus = 'READY' | 'REVIEW_REQUIRED' | 'FURTHER_PREPARATION' | 'ESCALATE';

export type QuestionType = 'multiple-choice' | 'true-false';

export type GroundingLevel = 'SUPPORTED' | 'PARTIAL' | 'INSUFFICIENT';

export type CoachCategory = 'CONCEPT' | 'PROCEDURE' | 'APPLICATION' | 'TROUBLESHOOTING' | 'COMPLIANCE' | 'OUT_OF_SCOPE';

export interface Domain {
  id: string;
  name: string;
  description: string;
  complianceLabel: string;
}

export interface LearningModule {
  id: string;
  domainId: string;
  title: string;
  description: string;
  ownerId: string;
  status: 'draft' | 'published' | 'archived';
  activeVersionId: string;
  estimatedMinutes: number;
}

export interface ModuleVersion {
  id: string;
  moduleId: string;
  version: string;
  approvalStatus: 'draft' | 'approved' | 'published';
  publishedAt: string | null;
  lastReviewedAt: string;
  sourceVersion: string;
}

export interface LearningObjective {
  id: string;
  moduleVersionId: string;
  title: string;
  description: string;
  sequence: number;
}

export interface Competency {
  id: string;
  moduleVersionId: string;
  name: string;
  description: string;
  weight: number;
  minimumThreshold: number;
  mandatory: boolean;
  critical: boolean;
}

export interface GuidedActivity {
  id: string;
  moduleVersionId: string;
  title: string;
  activityType: 'instruction' | 'demonstration' | 'warning' | 'practice' | 'reflection';
  sequence: number;
  content: string;
  explanation: string;
  warning: string | null;
  linkedCompetencyId: string;
}

export interface AssessmentQuestion {
  id: string;
  moduleVersionId: string;
  competencyId: string;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  critical: boolean;
  sourceReference: string;
}

export interface Attempt {
  id: string;
  learnerId: string;
  moduleVersionId: string;
  startedAt: string;
  submittedAt: string | null;
  status: 'in_progress' | 'submitted' | 'scored';
}

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  isCriticalFailure: boolean;
}

export interface CompetencyScore {
  competencyId: string;
  competencyName: string;
  score: number;
  threshold: number;
  passed: boolean;
  mandatory: boolean;
  critical: boolean;
}

export interface ReadinessResult {
  id: string;
  attemptId: string;
  overallScore: number;
  status: ReadinessStatus;
  competencyScores: CompetencyScore[];
  criticalFailures: string[];
  strengths: string[];
  reviewAreas: string[];
  remediationActions: RemediationAction[];
}

export interface RemediationAction {
  competencyId: string;
  competencyName: string;
  action: string;
  sourceReference: string;
}

export interface CoachResponse {
  answer: string;
  category: CoachCategory;
  citations: Citation[];
  grounding: GroundingLevel;
  recommendedAction: string;
  escalate: boolean;
  conversationId: string;
}

export interface Citation {
  sourceTitle: string;
  section: string;
  version: string;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  category?: CoachCategory;
  citations?: Citation[];
  grounding?: GroundingLevel;
  escalate?: boolean;
  timestamp: string;
}

// Instructor types
export interface CohortMetrics {
  moduleId: string;
  moduleTitle: string;
  assigned: number;
  started: number;
  completed: number;
  completionRate: number;
  readinessDistribution: Record<ReadinessStatus, number>;
  competencyAverages: { competencyName: string; average: number }[];
}

export interface Misconception {
  id: string;
  questionId: string;
  questionText: string;
  competencyName: string;
  incorrectAnswer: string;
  frequency: number;
  isCritical: boolean;
}

export interface InterventionItem {
  learnerId: string;
  learnerName: string;
  status: ReadinessStatus;
  failedCompetencies: string[];
  criticalFailures: string[];
  lastAttemptAt: string;
  attemptCount: number;
}

// Admin types
export interface ModuleRegistryEntry {
  moduleId: string;
  title: string;
  domain: string;
  owner: string;
  activeVersion: string;
  sourceVersion: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string | null;
  lastReviewedAt: string;
  totalAttempts: number;
  completionRate: number;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  details: string;
}

// Adaptive Learning — Comprehension Checkpoints
export type CheckpointApprovalStatus = 'auto_generated' | 'approved' | 'rejected' | 'edited';

export interface CheckpointQuestion {
  id: string;
  activityId: string;
  moduleVersionId: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  failureHint: string; // What to re-read when wrong
  approvalStatus: CheckpointApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  generatedAt: string;
  minimumReadSeconds: number; // Minimum time before checkpoint appears
}

export interface StepEngagement {
  activityId: string;
  learnerId: string;
  timeSpentSeconds: number;
  checkpointAttempts: number;
  passed: boolean;
  firstAttemptCorrect: boolean;
}

export interface StepFriction {
  activityId: string;
  activityTitle: string;
  stepNumber: number;
  totalAttempts: number;
  firstAttemptPassRate: number;
  averageRetries: number;
  averageTimeSpent: number;
}

// Demo user
export interface DemoUser {
  id: string;
  name: string;
  role: Role;
  email: string;
  domainId?: string;
}
