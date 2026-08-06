"use client";

import { useState, useEffect, useCallback } from "react";
import type { PreviewModuleData } from "./preview-data";

interface Props {
  data: PreviewModuleData;
  onComplete: () => void;
  onBack: () => void;
}

type StepState = "reading" | "checkpoint" | "failed" | "passed";

export function PreviewActivity({ data, onComplete, onBack }: Props) {
  const { activities, competencies, checkpoints } = data;
  const [currentStep, setCurrentStep] = useState(0);
  const [stepState, setStepState] = useState<StepState>("reading");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [passedSteps, setPassedSteps] = useState<Set<number>>(new Set());

  const activity = activities[currentStep];
  const linkedCompetency = competencies.find((c) => c.id === activity.linkedCompetencyId);
  const checkpoint = checkpoints.find((cp) => cp.activityId === activity.id);
  const minimumReadTime = checkpoint?.minimumReadSeconds ?? 15;
  const canShowCheckpoint = timeSpent >= minimumReadTime;

  useEffect(() => {
    if (stepState !== "reading") return;
    const interval = setInterval(() => { setTimeSpent((t) => t + 1); }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, stepState]);

  const handleCheckpointAnswer = useCallback(() => {
    if (!checkpoint || !selectedAnswer) return;
    if (selectedAnswer === checkpoint.correctAnswer) {
      setStepState("passed");
      setPassedSteps((prev) => new Set([...prev, currentStep]));
    } else {
      setStepState("failed");
      setRetryCount((c) => c + 1);
    }
  }, [checkpoint, selectedAnswer, currentStep]);

  const handleRetry = () => {
    setStepState("reading");
    setSelectedAnswer(null);
    setTimeSpent(0);
  };

  const handleNext = () => {
    if (currentStep < activities.length - 1) {
      setCurrentStep(currentStep + 1);
      setStepState("reading");
      setSelectedAnswer(null);
      setRetryCount(0);
      setTimeSpent(0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setStepState(passedSteps.has(currentStep - 1) ? "passed" : "reading");
      setSelectedAnswer(null);
      setRetryCount(0);
      setTimeSpent(0);
    }
  };

  const activityTypeStyles: Record<string, { bg: string; text: string; label: string }> = {
    instruction: { bg: "bg-blue-50", text: "text-blue-700", label: "Instruction" },
    demonstration: { bg: "bg-purple-50", text: "text-purple-700", label: "Demonstration" },
    warning: { bg: "bg-red-50", text: "text-red-700", label: "Critical Safety" },
    practice: { bg: "bg-green-50", text: "text-green-700", label: "Practice" },
    reflection: { bg: "bg-amber-50", text: "text-amber-700", label: "Reflection" },
  };

  const style = activityTypeStyles[activity.activityType] || activityTypeStyles.instruction;
  const isLastStep = currentStep === activities.length - 1;
  const canAdvance = !checkpoint || stepState === "passed" || passedSteps.has(currentStep);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Overview
        </button>
        <span className="text-sm text-slate-500">Step {currentStep + 1} of {activities.length}</span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(passedSteps.size / activities.length) * 100}%` }} />
      </div>

      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${activity.activityType === "warning" ? "border-red-200" : "border-slate-200"}`}>
        <div className={`px-6 py-4 border-b ${activity.activityType === "warning" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>{style.label}</span>
            {linkedCompetency && <span className="text-xs text-slate-400">{linkedCompetency.name}</span>}
            {checkpoint && <span className="ml-auto inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 border border-indigo-200">Checkpoint</span>}
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{activity.title}</h2>
        </div>
        <div className="p-6 space-y-4">
          {activity.warning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <span className="text-red-500 text-lg flex-shrink-0">&#x26A0;&#xFE0F;</span>
              <p className="text-sm text-red-800 font-medium">{activity.warning}</p>
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            {activity.content.split("\n").map((line, i) => (
              <p key={i} className="text-slate-700 leading-relaxed">{line}</p>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
            <p className="text-xs font-medium text-blue-800 mb-1">Why this matters:</p>
            <p className="text-sm text-blue-700">{activity.explanation}</p>
          </div>
        </div>

        {checkpoint && stepState === "reading" && (
          <div className="px-6 py-4 bg-indigo-50 border-t border-indigo-100">
            {!canShowCheckpoint ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-indigo-700">Reading timer: {timeSpent}s / {minimumReadTime}s</p>
              </div>
            ) : (
              <div className="text-center">
                <button onClick={() => setStepState("checkpoint")} className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                  Take Comprehension Check
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {checkpoint && stepState === "checkpoint" && (
        <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-indigo-900">Comprehension Check</h3>
          <p className="text-base font-medium text-slate-900">{checkpoint.questionText}</p>
          <div className="space-y-2">
            {checkpoint.options.map((opt, i) => (
              <button key={i} onClick={() => setSelectedAnswer(opt)} className={`w-full text-left p-3 rounded-lg border-2 text-sm ${selectedAnswer === opt ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                {opt}
              </button>
            ))}
          </div>
          <button onClick={handleCheckpointAnswer} disabled={!selectedAnswer} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg disabled:opacity-40">
            Submit Answer
          </button>
        </div>
      )}

      {checkpoint && stepState === "failed" && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-red-800">Incorrect - Review Required</h3>
          <p className="text-sm text-red-700">Hint: {checkpoint.failureHint}</p>
          <button onClick={handleRetry} className="w-full py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
            Review Content &amp; Retry
          </button>
        </div>
      )}

      {checkpoint && stepState === "passed" && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">&#x2705;</span>
          <p className="text-sm font-bold text-green-800">Checkpoint Passed!{retryCount > 0 && ` (${retryCount} retries)`}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={handlePrevious} disabled={currentStep === 0} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40">
          Previous
        </button>
        {isLastStep && canAdvance ? (
          <button onClick={onComplete} className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">
            Continue to AI Coach
          </button>
        ) : (
          <button onClick={handleNext} disabled={!canAdvance} className={`px-4 py-2 text-sm font-medium rounded-lg ${canAdvance ? "text-white bg-blue-600 hover:bg-blue-700" : "text-slate-400 bg-slate-100 cursor-not-allowed"}`}>
            {canAdvance ? "Next" : "Complete Checkpoint"}
          </button>
        )}
      </div>
    </div>
  );
}
