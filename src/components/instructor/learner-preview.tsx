"use client";

import { useState } from "react";
import { useApp } from "../providers";
import { getModuleData } from "./preview-data";
import { PreviewOverview } from "./preview-overview";
import { PreviewActivity } from "./preview-activity";
import { PreviewAssessment } from "./preview-assessment";
import { PreviewReport } from "./preview-report";
import type { ReadinessResult, AttemptAnswer } from "@/lib/domain/types";

type PreviewStep = "overview" | "activity" | "coach" | "assessment" | "report";

export function LearnerPreview() {
  const { exitPreviewMode, previewModuleId } = useApp();
  const [step, setStep] = useState<PreviewStep>("overview");
  const [previewResult, setPreviewResult] = useState<ReadinessResult | null>(null);
  const [previewAnswers, setPreviewAnswers] = useState<AttemptAnswer[]>([]);

  const moduleData = getModuleData(previewModuleId ?? "");

  const handleAssessmentComplete = (result: ReadinessResult, answers: AttemptAnswer[]) => {
    setPreviewResult(result);
    setPreviewAnswers(answers);
    setStep("report");
  };

  if (!moduleData) {
    return (
      <div className="space-y-4">
        <PreviewBanner onExit={exitPreviewMode} moduleTitle="Unknown" />
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Module not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PreviewBanner onExit={exitPreviewMode} moduleTitle={moduleData.module.title} />
      {step === "overview" && (
        <PreviewOverview data={moduleData} onStart={() => setStep("activity")} />
      )}
      {step === "activity" && (
        <PreviewActivity
          data={moduleData}
          onComplete={() => setStep("coach")}
          onBack={() => setStep("overview")}
        />
      )}
      {step === "coach" && (
        <PreviewCoachPlaceholder
          onProceed={() => setStep("assessment")}
          onBack={() => setStep("activity")}
        />
      )}
      {step === "assessment" && (
        <PreviewAssessment
          data={moduleData}
          onComplete={handleAssessmentComplete}
          onBack={() => setStep("coach")}
        />
      )}
      {step === "report" && (
        <PreviewReport
          data={moduleData}
          result={previewResult}
          attemptAnswers={previewAnswers}
          onBack={() => setStep("overview")}
        />
      )}
    </div>
  );
}

function PreviewBanner({ onExit, moduleTitle }: { onExit: () => void; moduleTitle: string }) {
  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">&#x1F441;</span>
        <div>
          <p className="text-sm font-bold text-amber-900">
            PREVIEW MODE - Simulating Learner View
          </p>
          <p className="text-xs text-amber-700">
            Previewing: {moduleTitle}. No data is persisted in this mode.
          </p>
        </div>
      </div>
      <button
        onClick={onExit}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors"
      >
        Exit Preview
      </button>
    </div>
  );
}

function PreviewCoachPlaceholder({ onProceed, onBack }: { onProceed: () => void; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Activity
        </button>
        <button
          onClick={onProceed}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Proceed to Assessment
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center space-y-3">
        <span className="text-4xl">&#x1F916;</span>
        <h3 className="text-lg font-semibold text-slate-900">AI Coach (Preview)</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          In the live learner experience, the AI Coach provides source-grounded
          answers with citations. In preview mode, this step is shown as a
          placeholder. Click &quot;Proceed to Assessment&quot; to continue.
        </p>
      </div>
    </div>
  );
}
