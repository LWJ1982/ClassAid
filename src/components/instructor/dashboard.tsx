"use client";

import { useState } from "react";
import {
  learningModule,
  csModule,
  cohortMetrics,
  csCohortMetrics,
  misconceptions,
  csMisconceptions,
  interventionList,
  csInterventionList,
  stepFrictionData,
  csStepFrictionData,
  domains,
} from "@/lib/data/seed";
import { useApp } from "../providers";
import type { LearningModule, CohortMetrics, Misconception, InterventionItem, StepFriction } from "@/lib/domain/types";

// Map module IDs to their data sets
const moduleDataMap: Record<string, {
  module: LearningModule;
  metrics: CohortMetrics;
  misconceptions: Misconception[];
  interventions: InterventionItem[];
  stepFriction: StepFriction[];
}> = {
  "module-1": {
    module: learningModule,
    metrics: cohortMetrics,
    misconceptions: misconceptions,
    interventions: interventionList,
    stepFriction: stepFrictionData,
  },
  "module-2": {
    module: csModule,
    metrics: csCohortMetrics,
    misconceptions: csMisconceptions,
    interventions: csInterventionList,
    stepFriction: csStepFrictionData,
  },
};

const allModules: LearningModule[] = [learningModule, csModule];

export function InstructorDashboard() {
  const { currentUser } = useApp();

  // Filter to only modules owned by this instructor
  const ownedModules = allModules.filter((m) => m.ownerId === currentUser.id);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(ownedModules[0]?.id ?? "");

  const data = moduleDataMap[selectedModuleId];
  const instructorDomain = domains.find((d) => d.id === currentUser.domainId);

  if (ownedModules.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cohort Insights</h1>
          <p className="text-slate-500 mt-1">Instructor: {currentUser.name}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-slate-500">No modules assigned to you yet.</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cohort Insights</h1>
          <p className="text-slate-500 mt-1">Instructor: {currentUser.name}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-slate-500">Select a module to view insights.</p>
        </div>
      </div>
    );
  }

  const metrics = data.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cohort Insights</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-slate-500">
            Instructor: {currentUser.name}
          </p>
          {instructorDomain && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              {instructorDomain.name}
            </span>
          )}
        </div>
      </div>

      {/* Module selector (if instructor owns multiple modules) */}
      {ownedModules.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <label htmlFor="module-selector" className="block text-sm font-medium text-slate-700 mb-2">
            Select Module
          </label>
          <select
            id="module-selector"
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {ownedModules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Module title */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <p className="text-sm text-slate-500">Currently viewing</p>
        <p className="text-lg font-semibold text-slate-900">{metrics.moduleTitle}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Assigned" value={metrics.assigned} />
        <MetricCard label="Started" value={metrics.started} sub={`${Math.round((metrics.started / metrics.assigned) * 100)}%`} />
        <MetricCard label="Completed" value={metrics.completed} sub={`${Math.round(metrics.completionRate * 100)}% rate`} />
        <MetricCard label="Ready" value={metrics.readinessDistribution.READY} sub={`of ${metrics.completed} completed`} color="green" />
      </div>

      {/* Readiness distribution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Readiness Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatusCard status="Ready" count={metrics.readinessDistribution.READY} total={metrics.completed} color="green" />
          <StatusCard status="Review Required" count={metrics.readinessDistribution.REVIEW_REQUIRED} total={metrics.completed} color="amber" />
          <StatusCard status="Further Prep" count={metrics.readinessDistribution.FURTHER_PREPARATION} total={metrics.completed} color="red" />
          <StatusCard status="Escalate" count={metrics.readinessDistribution.ESCALATE} total={metrics.completed} color="purple" />
        </div>
      </div>

      {/* Competency averages */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Competency Averages</h2>
        <div className="space-y-4">
          {metrics.competencyAverages.map((ca) => (
            <div key={ca.competencyName}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700">{ca.competencyName}</span>
                <span className={`text-sm font-bold ${ca.average >= 0.8 ? "text-green-600" : ca.average >= 0.6 ? "text-amber-600" : "text-red-600"}`}>
                  {Math.round(ca.average * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${ca.average >= 0.8 ? "bg-green-500" : ca.average >= 0.6 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${Math.round(ca.average * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Misconceptions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Top Misconceptions</h2>
        <div className="space-y-3">
          {data.misconceptions.map((m) => (
            <div key={m.id} className={`p-4 rounded-lg border ${m.isCritical ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900">{m.questionText}</span>
                    {m.isCritical && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Critical</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Common wrong answer: <span className="italic">&quot;{m.incorrectAnswer}&quot;</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Competency: {m.competencyName}</p>
                </div>
                <div className="text-center ml-4">
                  <div className="text-lg font-bold text-slate-900">{m.frequency}</div>
                  <div className="text-xs text-slate-500">learners</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intervention list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Learners Requiring Intervention
          <span className="ml-2 text-sm font-normal text-slate-500">({data.interventions.length})</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Learner</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Failed Competencies</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Critical Failures</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-slate-500 uppercase">Attempts</th>
              </tr>
            </thead>
            <tbody>
              {data.interventions.map((item) => (
                <tr key={item.learnerId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3 font-medium text-slate-900">{item.learnerName}</td>
                  <td className="py-3 px-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-3 text-slate-600">{item.failedCompetencies.join(", ")}</td>
                  <td className="py-3 px-3">
                    {item.criticalFailures.length > 0 ? (
                      <span className="text-red-600 text-xs">{item.criticalFailures[0]}</span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{item.attemptCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step Friction Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Activity Step Friction</h2>
        <p className="text-sm text-slate-500 mb-4">
          Which guided activity steps cause learners to struggle. High retry rates indicate content that needs clarification or a poorly worded checkpoint.
        </p>
        <div className="space-y-3">
          {data.stepFriction
            .sort((a, b) => a.firstAttemptPassRate - b.firstAttemptPassRate)
            .map((step) => {
              const frictionLevel = step.firstAttemptPassRate < 0.6 ? "high" : step.firstAttemptPassRate < 0.75 ? "medium" : "low";
              return (
                <div key={step.activityId} className={`p-4 rounded-lg border ${
                  frictionLevel === "high" ? "bg-red-50 border-red-200" :
                  frictionLevel === "medium" ? "bg-amber-50 border-amber-200" :
                  "bg-slate-50 border-slate-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Step {step.stepNumber}</span>
                      <span className="text-sm font-medium text-slate-900">{step.activityTitle}</span>
                      {frictionLevel === "high" && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">High Friction</span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${
                      frictionLevel === "high" ? "text-red-600" :
                      frictionLevel === "medium" ? "text-amber-600" :
                      "text-green-600"
                    }`}>
                      {Math.round(step.firstAttemptPassRate * 100)}% first-pass
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        frictionLevel === "high" ? "bg-red-500" :
                        frictionLevel === "medium" ? "bg-amber-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${Math.round(step.firstAttemptPassRate * 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Avg retries: <strong>{step.averageRetries.toFixed(1)}</strong></span>
                    <span>Avg time: <strong>{step.averageTimeSpent}s</strong></span>
                    <span>Total attempts: <strong>{step.totalAttempts}</strong></span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <div className={`text-2xl font-bold ${color === "green" ? "text-green-600" : "text-slate-900"}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function StatusCard({ status, count, total, color }: { status: string; count: number; total: number; color: string }) {
  const colorMap: Record<string, string> = {
    green: "bg-green-50 border-green-200 text-green-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    red: "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };
  return (
    <div className={`rounded-lg border p-3 text-center ${colorMap[color]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium mt-0.5">{status}</div>
      <div className="text-xs opacity-60 mt-0.5">{total > 0 ? Math.round((count / total) * 100) : 0}%</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    READY: "bg-green-100 text-green-700",
    REVIEW_REQUIRED: "bg-amber-100 text-amber-700",
    FURTHER_PREPARATION: "bg-red-100 text-red-700",
    ESCALATE: "bg-purple-100 text-purple-700",
  };
  const labels: Record<string, string> = {
    READY: "Ready",
    REVIEW_REQUIRED: "Review",
    FURTHER_PREPARATION: "Further Prep",
    ESCALATE: "Escalate",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {labels[status] || status}
    </span>
  );
}
