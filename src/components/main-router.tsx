"use client";

import { useState } from "react";
import { useApp } from "./providers";
import { LearnerDashboard } from "./learner/dashboard";
import { ModuleOverview } from "./learner/module-overview";
import { GuidedActivity } from "./learner/guided-activity";
import { AICoach } from "./learner/ai-coach";
import { Assessment } from "./learner/assessment";
import { ReadinessReport } from "./learner/readiness-report";
import { InstructorDashboard } from "./instructor/dashboard";
import { AdminRegistry } from "./admin/registry";

export type LearnerView = "dashboard" | "overview" | "activity" | "coach" | "assessment" | "report";

export function MainRouter() {
  const { role } = useApp();
  const [learnerView, setLearnerView] = useState<LearnerView>("dashboard");

  if (role === "instructor") {
    return <InstructorDashboard />;
  }

  if (role === "admin") {
    return <AdminRegistry />;
  }

  // Learner flow
  switch (learnerView) {
    case "dashboard":
      return <LearnerDashboard onStart={() => setLearnerView("overview")} />;
    case "overview":
      return <ModuleOverview onStartActivity={() => setLearnerView("activity")} onBack={() => setLearnerView("dashboard")} />;
    case "activity":
      return <GuidedActivity onComplete={() => setLearnerView("coach")} onBack={() => setLearnerView("overview")} />;
    case "coach":
      return <AICoach onProceedToAssessment={() => setLearnerView("assessment")} onBack={() => setLearnerView("activity")} />;
    case "assessment":
      return <Assessment onComplete={() => setLearnerView("report")} onBack={() => setLearnerView("coach")} />;
    case "report":
      return <ReadinessReport onRetry={() => setLearnerView("assessment")} onBackToDashboard={() => setLearnerView("dashboard")} />;
    default:
      return <LearnerDashboard onStart={() => setLearnerView("overview")} />;
  }
}
