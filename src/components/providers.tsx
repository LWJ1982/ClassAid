"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Role, DemoUser, ReadinessResult, AttemptAnswer, Competency, AssessmentQuestion, GuidedActivity, CheckpointQuestion, CheckpointApprovalStatus } from "@/lib/domain/types";
import { demoUsers, competencies as seedCompetencies, questions as seedQuestions, activities as seedActivities, checkpointQuestions as seedCheckpoints } from "@/lib/data/seed";
import { saveState, loadState, clearState, saveUsers, loadUsers, clearUsers } from "@/lib/persistence";
import { useAuth } from "@/components/auth/auth-provider";

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
  setCurrentDemoUser: (userId: string) => void;
  // User management (admin)
  users: DemoUser[];
  addUser: (user: DemoUser) => void;
  removeUser: (userId: string) => void;
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
  // Preview mode (instructor simulating learner journey)
  isPreviewMode: boolean;
  previewModuleId: string | null;
  enterPreviewMode: (moduleId: string) => void;
  exitPreviewMode: () => void;
  // Demo controls
  resetDemo: () => void;
  hydrated: boolean;
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
  const { isDemo, role: authRole, user } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [selectedDemoUserId, setSelectedDemoUserId] = useState<string>(() => {
    if (typeof window === "undefined") return "user-learner-1";
    const saved = loadState();
    return saved?.selectedDemoUserId ?? "user-learner-1";
  });
  const [role, setRoleState] = useState<Role>(() => {
    if (typeof window === "undefined") return "learner";
    const saved = loadState();
    return (saved?.role as Role) ?? "learner";
  });
  const [activityProgress, setActivityProgress] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = loadState();
    return saved?.activityProgress ?? 0;
  });
  const [assessmentAnswers, setAssessmentAnswersState] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    const saved = loadState();
    return (saved?.assessmentAnswers as Record<string, string>) ?? {};
  });
  const [readinessResult, setReadinessResult] = useState<ReadinessResult | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = loadState();
    return (saved?.readinessResult as ReadinessResult) ?? null;
  });
  const [attemptAnswers, setAttemptAnswers] = useState<AttemptAnswer[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = loadState();
    return (saved?.attemptAnswers as AttemptAnswer[]) ?? [];
  });
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = loadState();
    return saved?.assessmentSubmitted ?? false;
  });
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>(() => {
    if (typeof window === "undefined") return getInitialConfig();
    const saved = loadState();
    return (saved?.moduleConfig as ModuleConfig) ?? getInitialConfig();
  });

  const [users, setUsers] = useState<DemoUser[]>(() => {
    if (typeof window === "undefined") return [...demoUsers];
    const saved = loadUsers();
    return saved ?? [...demoUsers];
  });

  // Preview mode state (not persisted - resets on refresh)
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewModuleId, setPreviewModuleId] = useState<string | null>(null);

  // Mark hydrated after first render (canonical hydration pattern)
  useEffect(() => { setHydrated(true); }, []);

  // Persist state changes
  useEffect(() => {
    if (!hydrated) return;
    saveState({
      role,
      selectedDemoUserId,
      activityProgress,
      assessmentAnswers,
      assessmentSubmitted,
      readinessResult,
      attemptAnswers,
      moduleConfig,
    });
  }, [hydrated, role, selectedDemoUserId, activityProgress, assessmentAnswers, assessmentSubmitted, readinessResult, attemptAnswers, moduleConfig]);

  // Persist users list
  useEffect(() => {
    if (!hydrated) return;
    saveUsers(users);
  }, [hydrated, users]);

  // When authenticated (not demo), derive role from auth context
  const effectiveRole: Role = isDemo ? role : authRole;

  const currentUser = isDemo
    ? (users.find((u) => u.id === selectedDemoUserId) ?? users[0])
    : {
        id: user?.id ?? "anonymous",
        name: user?.user_metadata?.name ?? user?.email ?? "User",
        email: user?.email ?? "",
        role: authRole,
      };

  const setRole = useCallback((newRole: Role) => {
    // Only allow role switching in demo mode
    if (isDemo) {
      setRoleState(newRole);
      // When switching role via shortcut, select the first user of that role
      const firstUserOfRole = users.find((u) => u.role === newRole);
      if (firstUserOfRole) {
        setSelectedDemoUserId(firstUserOfRole.id);
      }
    }
  }, [isDemo, users]);

  const setCurrentDemoUser = useCallback((userId: string) => {
    if (!isDemo) return;
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setSelectedDemoUserId(userId);
      setRoleState(targetUser.role);
    }
  }, [isDemo, users]);

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

  const addUser = useCallback((newUser: DemoUser) => {
    setUsers((prev) => [...prev, newUser]);
  }, []);

  const removeUser = useCallback((userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
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

  const enterPreviewMode = useCallback((moduleId: string) => {
    setIsPreviewMode(true);
    setPreviewModuleId(moduleId);
  }, []);

  const exitPreviewMode = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewModuleId(null);
  }, []);

  const resetDemo = useCallback(() => {
    clearState();
    clearUsers();
    setSelectedDemoUserId("user-learner-1");
    setRoleState("learner");
    setActivityProgress(0);
    setAssessmentAnswersState({});
    setReadinessResult(null);
    setAttemptAnswers([]);
    setAssessmentSubmitted(false);
    setModuleConfig(getInitialConfig());
    setUsers([...demoUsers]);
    setIsPreviewMode(false);
    setPreviewModuleId(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role: effectiveRole,
        setRole,
        setCurrentDemoUser,
        users,
        addUser,
        removeUser,
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
        isPreviewMode,
        previewModuleId,
        enterPreviewMode,
        exitPreviewMode,
        resetDemo,
        hydrated,
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
