"use client";

import { useState } from "react";
import { useApp } from "../providers";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export function GuidedActivity({ onComplete, onBack }: Props) {
  const { moduleConfig } = useApp();
  const activities = moduleConfig.activities;
  const competencies = moduleConfig.competencies;
  const [currentStep, setCurrentStep] = useState(0);
  const activity = activities[currentStep];
  const linkedCompetency = competencies.find((c) => c.id === activity.linkedCompetencyId);

  const activityTypeStyles: Record<string, { bg: string; text: string; label: string }> = {
    instruction: { bg: "bg-blue-50", text: "text-blue-700", label: "Instruction" },
    demonstration: { bg: "bg-purple-50", text: "text-purple-700", label: "Demonstration" },
    warning: { bg: "bg-red-50", text: "text-red-700", label: "Critical Safety" },
    practice: { bg: "bg-green-50", text: "text-green-700", label: "Practice" },
    reflection: { bg: "bg-amber-50", text: "text-amber-700", label: "Reflection" },
  };

  const style = activityTypeStyles[activity.activityType] || activityTypeStyles.instruction;

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
        <span className="text-sm text-slate-500">
          Step {currentStep + 1} of {activities.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / activities.length) * 100}%` }}
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
          </div>
          <h2 className="text-xl font-semibold text-slate-900">{activity.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning banner */}
          {activity.warning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <span className="text-red-500 text-lg flex-shrink-0">\u26A0\uFE0F</span>
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
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-1.5">
        {activities.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === currentStep ? "bg-blue-600 scale-125" : i < currentStep ? "bg-blue-300" : "bg-slate-300"
            }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Previous
        </button>

        {currentStep < activities.length - 1 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue to AI Coach
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
