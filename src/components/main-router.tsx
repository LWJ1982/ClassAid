"use client";

import { useState, useEffect } from "react";
import { useApp } from "./providers";
import { useAuth } from "./auth/auth-provider";
import { Login } from "./auth/login";
import { Signup } from "./auth/signup";
import { LearnerDashboard } from "./learner/dashboard";
import { ModuleOverview } from "./learner/module-overview";
import { GuidedActivity } from "./learner/guided-activity";
import { AICoach } from "./learner/ai-coach";
import { Assessment } from "./learner/assessment";
import { ReadinessReport } from "./learner/readiness-report";
import { InstructorDashboard } from "./instructor/dashboard";
import { ModuleConfig } from "./instructor/module-config";
import { CheckpointApproval } from "./instructor/checkpoint-approval";
import { ContentManagement } from "./instructor/content-management";
import { AdminRegistry } from "./admin/registry";

export type LearnerView = "dashboard" | "overview" | "activity" | "coach" | "assessment" | "report";
export type InstructorView = "insights" | "configure" | "checkpoints" | "content";

export function MainRouter() {
  const { role, assessmentSubmitted, readinessResult } = useApp();
  const { isDemo, user, isLoading } = useAuth();
  const [learnerView, setLearnerView] = useState<LearnerView>("dashboard");
  const [instructorView, setInstructorView] = useState<InstructorView>("insights");
  const [authView, setAuthView] = useState<"login" | "signup">("login");

  // If assessment was submitted and there's a result, default to report view
  useEffect(() => {
    if (assessmentSubmitted && readinessResult && learnerView === "dashboard") {
      // Don't auto-redirect, let user choose
    }
  }, [assessmentSubmitted, readinessResult, learnerView]);

  // Show loading spinner while checking auth state
  if (!isDemo && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Auth gate: if not demo and not authenticated, show login/signup
  if (!isDemo && !user) {
    if (authView === "signup") {
      return <Signup onToggleLogin={() => setAuthView("login")} />;
    }
    return <Login onToggleSignup={() => setAuthView("signup")} />;
  }

  if (role === "instructor") {
    return (
      <div className="space-y-4">
        {/* Instructor sub-navigation */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 w-fit">
          <button
            onClick={() => setInstructorView("insights")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              instructorView === "insights"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            &#x1F4CA; Cohort Insights
          </button>
          <button
            onClick={() => setInstructorView("configure")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              instructorView === "configure"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            &#x2699;&#xFE0F; Module Configuration
          </button>
          <button
            onClick={() => setInstructorView("checkpoints")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              instructorView === "checkpoints"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            &#x2705; Checkpoint Approval
          </button>
          <button
            onClick={() => setInstructorView("content")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              instructorView === "content"
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            &#x1F4C4; Content &amp; AI
          </button>
        </div>

        {/* Instructor content */}
        {instructorView === "insights" && <InstructorDashboard />}
        {instructorView === "configure" && <ModuleConfig />}
        {instructorView === "checkpoints" && <CheckpointApproval />}
        {instructorView === "content" && <ContentManagement />}
      </div>
    );
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
