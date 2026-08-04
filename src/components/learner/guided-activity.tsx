"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "../providers";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

type StepState = "reading" | "checkpoint" | "failed" | "passed";

export function GuidedActivity({ onComplete, onBack }: Props) {
  const { moduleConfig } = useApp();
  const activities = moduleConfig.activities;
  const competencies = moduleConfig.competencies;
  const checkpoints = moduleConfig.checkpoints;

  const [currentStep, setCurrentStep] = useState(0);
  const [stepState, setStepState] = useState<StepState>("reading");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [passedSteps, setPassedSteps] = useState<Set<number>>(new Set());
  const [showContent, setShowContent] = useState(true);

  const activity = activities[currentStep];
  const linkedCompetency = competencies.find((c) => c.id === activity.linkedCompetencyId);

  // Get approved checkpoint for current activity
  const checkpoint = checkpoints.find(
    (cp) => cp.activityId === activity.id && cp.approvalStatus === "approved"
  );

  const minimumReadTime = checkpoint?.minimumReadSeconds ?? 15;
  const canShowCheckpoint = timeSpent >= minimumReadTime;

  // Timer for minimum reading time
  useEffect(() => {
    if (stepState !== "reading") return;
    const interval = setInterval(() => {
      setTimeSpent((t) => t + 1);
    }, 1000);
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
    setShowContent(true);
  };

  const handleNext = () => {
    if (currentStep < activities.length - 1) {
      setCurrentStep(currentStep + 1);
      setStepState("reading");
      setSelectedAnswer(null);
      setRetryCount(0);
      setShowContent(true);
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
      {/* Back + progress */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Overview
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Step {currentStep + 1} of {activities.length}
          </span>
          {retryCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {retryCount} {retryCount === 1 ? "retry" : "retries"}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((passedSteps.size) / activities.length) * 100}%` }}
        />
      </div>

      {/* Activity card */}
      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${activity.activityType === "warning" ? "border-red-200" : "border-slate-200"}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${activity.activityType === "warning" ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
              {style.label}
            </span>
            {linkedCompetency && (
              <span className="text-xs text-slate-400">
                {linkedCompetency.name}
                {linkedCompetency.critical && " \u2022 Critical"}
              </span>
            )}
            {checkpoint && (
              <span className="ml-auto inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 border border-indigo-200">
                &#x1F512; Checkpoint Required
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{activity.title}</h2>
        </div>

        {/* Content */}
        {showContent && (
          <div className="p-6 space-y-4">
            {/* Warning banner */}
            {activity.warning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <span className="text-red-500 text-lg flex-shrink-0">&#x26A0;&#xFE0F;</span>
                <p className="text-sm text-red-800 font-medium">{activity.warning}</p>
              </div>
            )}

            {/* Main content */}
            <div className="prose prose-sm max-w-none">
              {activity.content.split("\n").map((line, i) => (
                <p key={i} className="text-slate-700 leading-relaxed">
                  {line}
                </p>
              ))}
            </div>

            {/* Explanation */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
              <p className="text-xs font-medium text-blue-800 mb-1">Why this matters:</p>
              <p className="text-sm text-blue-700">{activity.explanation}</p>
            </div>
          </div>
        )}

        {/* Reading timer / checkpoint gate */}
        {checkpoint && stepState === "reading" && (
          <div className="px-6 py-4 bg-indigo-50 border-t border-indigo-100">
            {!canShowCheckpoint ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-900">Reading in progress...</p>
                  <p className="text-xs text-indigo-600">
                    Comprehension check available in {minimumReadTime - timeSpent} seconds. Take your time to understand the content.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-indigo-700">{timeSpent}s</div>
                  <div className="text-xs text-indigo-400">of {minimumReadTime}s min</div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={() => setStepState("checkpoint")}
                  className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  &#x2705; I&apos;ve read this — Take Comprehension Check
                </button>
                <p className="text-xs text-indigo-500 mt-2">You must pass the checkpoint to proceed to the next step.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Checkpoint question */}
      {checkpoint && stepState === "checkpoint" && (
        <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">&#x1F4DD;</span>
            <h3 className="text-sm font-bold text-indigo-900">Comprehension Check</h3>
          </div>
          <p className="text-base font-medium text-slate-900">{checkpoint.questionText}</p>
          <div className="space-y-2">
            {checkpoint.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedAnswer(opt)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm ${
                  selectedAnswer === opt
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedAnswer === opt ? "border-indigo-500 bg-indigo-500" : "border-slate-300"
                  }`}>
                    {selectedAnswer === opt && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  {opt}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={handleCheckpointAnswer}
            disabled={!selectedAnswer}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Failed state — loop back */}
      {checkpoint && stepState === "failed" && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">&#x274C;</span>
            <h3 className="text-sm font-bold text-red-800">Incorrect — Review Required</h3>
          </div>
          <p className="text-sm text-red-700">
            Your answer was not correct. You need to review the content before trying again.
          </p>
          <div className="bg-white border border-red-100 rounded-lg p-4">
            <p className="text-xs font-medium text-red-800 mb-1">&#x1F4A1; Hint:</p>
            <p className="text-sm text-red-700">{checkpoint.failureHint}</p>
          </div>
          <button
            onClick={handleRetry}
            className="w-full py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            &#x1F504; Review Content &amp; Retry
          </button>
          <p className="text-xs text-red-500 text-center">
            Attempt {retryCount + 1} — You must pass the checkpoint to continue.
          </p>
        </div>
      )}

      {/* Passed state */}
      {checkpoint && stepState === "passed" && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#x2705;</span>
            <div>
              <p className="text-sm font-bold text-green-800">Checkpoint Passed!</p>
              <p className="text-xs text-green-600">
                You demonstrated understanding of this step.
                {retryCount > 0 && ` (${retryCount} ${retryCount === 1 ? "retry" : "retries"} needed)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step indicators */}
      <div className="flex justify-center gap-1.5">
        {activities.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (i <= currentStep || passedSteps.has(i)) {
                setCurrentStep(i);
                setStepState(passedSteps.has(i) ? "passed" : "reading");
                setSelectedAnswer(null);
                setRetryCount(0);
              }
            }}
            disabled={i > currentStep && !passedSteps.has(i)}
            className={`w-3 h-3 rounded-full transition-all ${
              i === currentStep
                ? "bg-blue-600 scale-125"
                : passedSteps.has(i)
                ? "bg-green-500"
                : i < currentStep
                ? "bg-blue-300"
                : "bg-slate-300 cursor-not-allowed"
            }`}
            aria-label={`Step ${i + 1}${passedSteps.has(i) ? " (completed)" : ""}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Previous
        </button>

        {isLastStep && canAdvance ? (
          <button
            onClick={onComplete}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue to AI Coach
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              canAdvance
                ? "text-white bg-blue-600 hover:bg-blue-700"
                : "text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
            }`}
          >
            {!canAdvance ? (
              <>
                &#x1F512; Complete Checkpoint to Continue
              </>
            ) : (
              <>
                Next
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
