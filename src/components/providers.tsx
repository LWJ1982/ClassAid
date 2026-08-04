"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Role, DemoUser, ReadinessResult, AttemptAnswer } from "@/lib/domain/types";
import { demoUsers } from "@/lib/data/seed";

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
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("learner");
  const [activityProgress, setActivityProgress] = useState(0);
  const [assessmentAnswers, setAssessmentAnswersState] = useState<Record<string, string>>({});
  const [readinessResult, setReadinessResult] = useState<ReadinessResult | null>(null);
  const [attemptAnswers, setAttemptAnswers] = useState<AttemptAnswer[]>([]);
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);

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
