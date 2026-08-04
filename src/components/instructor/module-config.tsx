"use client";

import { useState } from "react";
import { useApp } from "../providers";
import { learningModule, moduleVersion } from "@/lib/data/seed";
import type { GuidedActivity } from "@/lib/domain/types";

type ConfigTab = "threshold" | "competencies" | "questions" | "activities";

export function ModuleConfig() {
  const [activeTab, setActiveTab] = useState<ConfigTab>("threshold");
  const { moduleConfig, resetConfig } = useApp();

  const tabs: { id: ConfigTab; label: string; count?: number }[] = [
    { id: "threshold", label: "Readiness Threshold" },
    { id: "competencies", label: "Competencies", count: moduleConfig.competencies.length },
    { id: "questions", label: "Questions", count: moduleConfig.questions.length },
    { id: "activities", label: "Activities", count: moduleConfig.activities.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Module Configuration</h1>
          <p className="text-slate-500 mt-1">
            {learningModule.title} &middot; v{moduleVersion.version}
          </p>
        </div>

        <button
          onClick={resetConfig}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex gap-3">
          <span className="text-blue-500 text-lg">&#x2699;&#xFE0F;</span>
          <div>
            <p className="text-sm font-medium text-blue-900">Instructor Configuration Panel</p>
            <p className="text-sm text-blue-700 mt-1">
              Changes made here are applied immediately to the learner assessment.
              Adjust competency weights, thresholds, critical rules, and activity content
              to match your module requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "threshold" && <ThresholdConfig />}
      {activeTab === "competencies" && <CompetenciesConfig />}
      {activeTab === "questions" && <QuestionsConfig />}
      {activeTab === "activities" && <ActivitiesConfig />}
    </div>
  );
}


function ThresholdConfig() {
  const { moduleConfig, updateOverallThreshold } = useApp();
  const threshold = moduleConfig.overallThreshold;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Overall Readiness Threshold</h3>
        <p className="text-sm text-slate-500 mt-1">
          The minimum overall weighted score a learner must achieve to receive a &quot;Ready&quot; status.
          Critical failures still override this threshold.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-6">
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={Math.round(threshold * 100)}
            onChange={(e) => updateOverallThreshold(Number(e.target.value) / 100)}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="w-20 text-center">
            <span className="text-2xl font-bold text-slate-900">{Math.round(threshold * 100)}%</span>
          </div>
        </div>

        <div className="flex justify-between text-xs text-slate-400">
          <span>50% (Lenient)</span>
          <span>75% (Standard)</span>
          <span>100% (Strict)</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-700">
          <strong>Note:</strong> Even if a learner meets this threshold, critical failures
          (safety/compliance questions marked as critical) will still prevent a &quot;Ready&quot; outcome.
        </p>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Threshold Preview</h4>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="font-bold text-green-700">READY</div>
            <div className="text-xs text-green-600 mt-1">&ge; {Math.round(threshold * 100)}% + no critical fail</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="font-bold text-amber-700">REVIEW</div>
            <div className="text-xs text-amber-600 mt-1">&ge; {Math.round(threshold * 75)}% or critical fail</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="font-bold text-red-700">FURTHER PREP</div>
            <div className="text-xs text-red-600 mt-1">&lt; {Math.round(threshold * 75)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}


function CompetenciesConfig() {
  const { moduleConfig, updateCompetency } = useApp();

  const totalWeight = moduleConfig.competencies.reduce((sum, c) => sum + c.weight, 0);
  const weightWarning = Math.abs(totalWeight - 1.0) > 0.01;

  return (
    <div className="space-y-4">
      {weightWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">
            <strong>&#x26A0;&#xFE0F; Weight Warning:</strong> Competency weights sum to{" "}
            {(totalWeight * 100).toFixed(0)}% (should be 100%). Adjust weights to total 100%.
          </p>
        </div>
      )}

      {moduleConfig.competencies.map((comp) => (
        <div key={comp.id} className={`bg-white rounded-xl border shadow-sm p-5 ${comp.critical ? "border-red-200" : "border-slate-200"}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900">{comp.name}</h4>
                {comp.critical && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Critical</span>
                )}
                {comp.mandatory && !comp.critical && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Mandatory</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{comp.description}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Weight ({Math.round(comp.weight * 100)}%)
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={Math.round(comp.weight * 100)}
                onChange={(e) => updateCompetency(comp.id, { weight: Number(e.target.value) / 100 })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Minimum threshold */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Min Threshold ({Math.round(comp.minimumThreshold * 100)}%)
              </label>
              <input
                type="range"
                min={40}
                max={100}
                step={5}
                value={Math.round(comp.minimumThreshold * 100)}
                onChange={(e) => updateCompetency(comp.id, { minimumThreshold: Number(e.target.value) / 100 })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Mandatory toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mandatory</label>
              <button
                onClick={() => updateCompetency(comp.id, { mandatory: !comp.mandatory })}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  comp.mandatory
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                {comp.mandatory ? "Yes - Required" : "No - Optional"}
              </button>
            </div>

            {/* Critical toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Critical (Safety)</label>
              <button
                onClick={() => updateCompetency(comp.id, { critical: !comp.critical })}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  comp.critical
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                {comp.critical ? "Yes - Blocks Ready" : "No - Standard"}
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-500">
          <strong>Weights</strong> determine how much each competency contributes to the overall score.
          <strong> Minimum threshold</strong> is the per-competency score required (for mandatory competencies).
          <strong> Critical</strong> competencies prevent Ready status on any failure regardless of overall score.
        </p>
      </div>
    </div>
  );
}


function QuestionsConfig() {
  const { moduleConfig, updateQuestion } = useApp();

  const competencyName = (compId: string) =>
    moduleConfig.competencies.find((c) => c.id === compId)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      {moduleConfig.questions.map((q, idx) => (
        <div key={q.id} className={`bg-white rounded-xl border shadow-sm p-5 ${q.critical ? "border-red-200" : "border-slate-200"}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {competencyName(q.competencyId)}
                </span>
                {q.critical && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Critical</span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-900">{q.questionText}</p>
            </div>
          </div>

          {/* Options display */}
          <div className="space-y-1.5 mb-4">
            {q.options.map((opt, i) => (
              <div key={i} className={`text-xs px-3 py-1.5 rounded border ${
                opt === q.correctAnswer
                  ? "bg-green-50 border-green-200 text-green-800 font-medium"
                  : "bg-slate-50 border-slate-100 text-slate-600"
              }`}>
                {opt === q.correctAnswer && <span className="mr-1">&#x2713;</span>}
                {opt}
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
            {/* Critical toggle */}
            <button
              onClick={() => updateQuestion(q.id, { critical: !q.critical })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                q.critical
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600"
              }`}
            >
              {q.critical ? "&#x26D4; Critical - Failure blocks Ready" : "Mark as Critical"}
            </button>

            {/* Competency assignment */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Competency:</label>
              <select
                value={q.competencyId}
                onChange={(e) => updateQuestion(q.id, { competencyId: e.target.value })}
                className="text-xs border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {moduleConfig.competencies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Source reference */}
          <div className="mt-3">
            <p className="text-xs text-slate-400">&#x1F4C4; {q.sourceReference}</p>
          </div>
        </div>
      ))}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-500">
          <strong>Critical questions</strong> prevent a Ready outcome if answered incorrectly, regardless of overall score.
          Use this for safety, compliance, or absolutely essential knowledge.
          Each question is linked to a competency for score calculation.
        </p>
      </div>
    </div>
  );
}


function ActivitiesConfig() {
  const { moduleConfig, updateActivity } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);

  const activityTypeStyles: Record<string, { bg: string; text: string }> = {
    instruction: { bg: "bg-blue-50", text: "text-blue-700" },
    demonstration: { bg: "bg-purple-50", text: "text-purple-700" },
    warning: { bg: "bg-red-50", text: "text-red-700" },
    practice: { bg: "bg-green-50", text: "text-green-700" },
    reflection: { bg: "bg-amber-50", text: "text-amber-700" },
  };

  const competencyName = (compId: string) =>
    moduleConfig.competencies.find((c) => c.id === compId)?.name ?? "Unknown";

  return (
    <div className="space-y-4">
      {moduleConfig.activities.map((act) => {
        const style = activityTypeStyles[act.activityType] || activityTypeStyles.instruction;
        const isEditing = editingId === act.id;

        return (
          <div key={act.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Step {act.sequence}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${style.bg} ${style.text}`}>
                  {act.activityType}
                </span>
                <span className="text-xs text-slate-400">{competencyName(act.linkedCompetencyId)}</span>
              </div>
              <button
                onClick={() => setEditingId(isEditing ? null : act.id)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {isEditing ? "Done" : "Edit"}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Title</label>
                  <input
                    type="text"
                    value={act.title}
                    onChange={(e) => updateActivity(act.id, { title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Content</label>
                  <textarea
                    value={act.content}
                    onChange={(e) => updateActivity(act.id, { content: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>

                {/* Warning */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Warning (optional - displays as alert)
                  </label>
                  <input
                    type="text"
                    value={act.warning ?? ""}
                    onChange={(e) => updateActivity(act.id, { warning: e.target.value || null })}
                    placeholder="Leave empty for no warning"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Type and competency */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                    <select
                      value={act.activityType}
                      onChange={(e) => updateActivity(act.id, { activityType: e.target.value as GuidedActivity["activityType"] })}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="instruction">Instruction</option>
                      <option value="demonstration">Demonstration</option>
                      <option value="warning">Warning</option>
                      <option value="practice">Practice</option>
                      <option value="reflection">Reflection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Linked Competency</label>
                    <select
                      value={act.linkedCompetencyId}
                      onChange={(e) => updateActivity(act.id, { linkedCompetencyId: e.target.value })}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {moduleConfig.competencies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-slate-900">{act.title}</h4>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{act.content}</p>
                {act.warning && (
                  <p className="text-xs text-red-600 mt-1">&#x26A0;&#xFE0F; {act.warning}</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-500">
          <strong>Activities</strong> form the guided learning path before assessment.
          Each activity is linked to a competency and can include warnings for critical safety information.
          Changes are reflected immediately in the learner view.
        </p>
      </div>
    </div>
  );
}
