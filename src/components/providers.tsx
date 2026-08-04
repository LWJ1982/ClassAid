"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Role, DemoUser, ReadinessResult, AttemptAnswer, Competency, AssessmentQuestion, GuidedActivity, CheckpointQuestion, CheckpointApprovalStatus } from "@/lib/domain/types";
import { demoUsers, competencies as seedCompetencies, questions as seedQuestions, activities as seedActivities, checkpointQuestions as seedCheckpoints } from "@/lib/data/seed";

// Module configuration state managed by instructor
export interface ModuleConfig {
  overallThreshold: number;
  competencies: Competency[];
  questions: AssessmentQuestion[];
  activities: GuidedActivity[];
  checkpoints: CheckpointQuestion[];
}

interface AppState {
  currentUser: DemoUser;
  role: Role;
  setRole: (role: Role) => void;
  // Learner state
  activityProgress: number;
  setActivityProgress: (step: number) => void;
  assessmentAnswers: Record<string, string>;
  setAssessmentAnswer: (questionId: string, answer: string) => void;
  resetAssessment: () => void;
  readinessResult: ReadinessResult | null;
  setReadinessResult: (result: ReadinessResult | null) => void;
  attemptAnswers: AttemptAnswer[];
  setAttemptAnswers: (answers: AttemptAnswer[]) => void;
  assessmentSubmitted: boolean;
  setAssessmentSubmitted: (v: boolean) => void;
  // Instructor module configuration
  moduleConfig: ModuleConfig;
  updateOverallThreshold: (threshold: number) => void;
  updateCompetency: (competencyId: string, updates: Partial<Competency>) => void;
  updateQuestion: (questionId: string, updates: Partial<AssessmentQuestion>) => void;
  updateActivity: (activityId: string, updates: Partial<GuidedActivity>) => void;
  updateCheckpoint: (checkpointId: string, updates: Partial<CheckpointQuestion>) => void;
  approveCheckpoint: (checkpointId: string) => void;
  rejectCheckpoint: (checkpointId: string) => void;
  resetConfig: () => void;
}

const AppContext = createContext<AppState | null>(null);

function getInitialConfig(): ModuleConfig {
  return {
    overallThreshold: 0.8,
    competencies: JSON.parse(JSON.stringify(seedCompetencies)),
    questions: JSON.parse(JSON.stringify(seedQuestions)),
    activities: JSON.parse(JSON.stringify(seedActivities)),
    checkpoints: JSON.parse(JSON.stringify(seedCheckpoints)),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("learner");
  const [activityProgress, setActivityProgress] = useState(0);
  const [assessmentAnswers, setAssessmentAnswersState] = useState<Record<string, string>>({});
  const [readinessResult, setReadinessResult] = useState<ReadinessResult | null>(null);
  const [attemptAnswers, setAttemptAnswers] = useState<AttemptAnswer[]>([]);
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>(getInitialConfig);

  const currentUser = demoUsers.find((u) => u.role === role) ?? demoUsers[0];

  const setRole = useCallback((newRole: Role) => {
    setRoleState(newRole);
  }, []);

  const setAssessmentAnswer = useCallback((questionId: string, answer: string) => {
    setAssessmentAnswersState((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const resetAssessment = useCallback(() => {
    setAssessmentAnswersState({});
    setReadinessResult(null);
    setAttemptAnswers([]);
    setAssessmentSubmitted(false);
  }, []);

  const updateOverallThreshold = useCallback((threshold: number) => {
    setModuleConfig((prev) => ({ ...prev, overallThreshold: threshold }));
  }, []);

  const updateCompetency = useCallback((competencyId: string, updates: Partial<Competency>) => {
    setModuleConfig((prev) => ({
      ...prev,
      competencies: prev.competencies.map((c) =>
        c.id === competencyId ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const updateQuestion = useCallback((questionId: string, updates: Partial<AssessmentQuestion>) => {
    setModuleConfig((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    }));
  }, []);

  const updateActivity = useCallback((activityId: string, updates: Partial<GuidedActivity>) => {
    setModuleConfig((prev) => ({
      ...prev,
      activities: prev.activities.map((a) =>
        a.id === activityId ? { ...a, ...updates } : a
      ),
    }));
  }, []);

  const resetConfig = useCallback(() => {
    setModuleConfig(getInitialConfig());
  }, []);

  const updateCheckpoint = useCallback((checkpointId: string, updates: Partial<CheckpointQuestion>) => {
    setModuleConfig((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((cp) =>
        cp.id === checkpointId ? { ...cp, ...updates } : cp
      ),
    }));
  }, []);

  const approveCheckpoint = useCallback((checkpointId: string) => {
    setModuleConfig((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((cp) =>
        cp.id === checkpointId
          ? { ...cp, approvalStatus: 'approved' as CheckpointApprovalStatus, approvedBy: 'user-instructor-1', approvedAt: new Date().toISOString() }
          : cp
      ),
    }));
  }, []);

  const rejectCheckpoint = useCallback((checkpointId: string) => {
    setModuleConfig((prev) => ({
      ...prev,
      checkpoints: prev.checkpoints.map((cp) =>
        cp.id === checkpointId
          ? { ...cp, approvalStatus: 'rejected' as CheckpointApprovalStatus }
          : cp
      ),
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role,
        setRole,
        activityProgress,
        setActivityProgress,
        assessmentAnswers,
        setAssessmentAnswer,
        resetAssessment,
        readinessResult,
        setReadinessResult,
        attemptAnswers,
        setAttemptAnswers,
        assessmentSubmitted,
        setAssessmentSubmitted,
        moduleConfig,
        updateOverallThreshold,
        updateCompetency,
        updateQuestion,
        updateActivity,
        updateCheckpoint,
        approveCheckpoint,
        rejectCheckpoint,
        resetConfig,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
