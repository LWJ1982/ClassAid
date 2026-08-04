"use client";

import { useState } from "react";
import { useApp } from "../providers";

type FilterStatus = "all" | "auto_generated" | "approved" | "rejected";

export function CheckpointApproval() {
  const { moduleConfig, approveCheckpoint, rejectCheckpoint, updateCheckpoint } = useApp();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);

  const checkpoints = moduleConfig.checkpoints;
  const activities = moduleConfig.activities;

  const filtered = filter === "all"
    ? checkpoints
    : checkpoints.filter((cp) => cp.approvalStatus === filter);

  const pendingCount = checkpoints.filter((cp) => cp.approvalStatus === "auto_generated").length;
  const approvedCount = checkpoints.filter((cp) => cp.approvalStatus === "approved").length;
  const rejectedCount = checkpoints.filter((cp) => cp.approvalStatus === "rejected").length;

  const getActivityTitle = (activityId: string) =>
    activities.find((a) => a.id === activityId)?.title ?? "Unknown";

  const getActivityStep = (activityId: string) =>
    activities.find((a) => a.id === activityId)?.sequence ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Checkpoint Question Approval</h2>
        <p className="text-sm text-slate-500 mt-1">
          Review auto-generated comprehension questions. Only approved questions are shown to learners during guided activities.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
        <div className="flex gap-3">
          <span className="text-purple-500 text-lg">&#x1F916;</span>
          <div>
            <p className="text-sm font-medium text-purple-900">Auto-Generated Questions</p>
            <p className="text-sm text-purple-700 mt-1">
              The system automatically generates comprehension checkpoint questions from activity content.
              These questions gate learner progression — learners cannot advance to the next step until they answer correctly.
              <strong> You must approve each question before it becomes active.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-amber-700">{pendingCount}</div>
          <div className="text-xs text-amber-600">Pending Review</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-700">{approvedCount}</div>
          <div className="text-xs text-green-600">Approved</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-700">{rejectedCount}</div>
          <div className="text-xs text-red-600">Rejected</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {([
          { id: "all", label: "All", count: checkpoints.length },
          { id: "auto_generated", label: "Pending", count: pendingCount },
          { id: "approved", label: "Approved", count: approvedCount },
          { id: "rejected", label: "Rejected", count: rejectedCount },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.id
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Question list */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No checkpoint questions match this filter.
          </div>
        )}

        {filtered.map((cp) => {
          const isEditing = editingId === cp.id;

          return (
            <div
              key={cp.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                cp.approvalStatus === "auto_generated"
                  ? "border-amber-200"
                  : cp.approvalStatus === "approved"
                  ? "border-green-200"
                  : "border-red-200"
              }`}
            >
              {/* Status bar */}
              <div className={`px-4 py-2 flex items-center justify-between ${
                cp.approvalStatus === "auto_generated"
                  ? "bg-amber-50"
                  : cp.approvalStatus === "approved"
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}>
                <div className="flex items-center gap-2">
                  <StatusBadge status={cp.approvalStatus} />
                  <span className="text-xs text-slate-500">
                    Step {getActivityStep(cp.activityId)}: {getActivityTitle(cp.activityId)}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Min read: {cp.minimumReadSeconds}s
                </span>
              </div>

              {/* Question content */}
              <div className="p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Question</label>
                      <input
                        type="text"
                        value={cp.questionText}
                        onChange={(e) => updateCheckpoint(cp.id, { questionText: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Options (correct answer highlighted)</label>
                      {cp.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 mb-1.5">
                          <input
                            type="radio"
                            name={`correct-${cp.id}`}
                            checked={opt === cp.correctAnswer}
                            onChange={() => updateCheckpoint(cp.id, { correctAnswer: opt })}
                            className="accent-green-600"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...cp.options];
                              const wasCorrect = newOptions[i] === cp.correctAnswer;
                              newOptions[i] = e.target.value;
                              const updates: Partial<typeof cp> = { options: newOptions };
                              if (wasCorrect) updates.correctAnswer = e.target.value;
                              updateCheckpoint(cp.id, updates);
                            }}
                            className={`flex-1 px-2 py-1 text-sm border rounded ${
                              opt === cp.correctAnswer ? "border-green-300 bg-green-50" : "border-slate-200"
                            } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Failure Hint (shown when learner answers wrong)</label>
                      <textarea
                        value={cp.failureHint}
                        onChange={(e) => updateCheckpoint(cp.id, { failureHint: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Minimum Read Time (seconds)</label>
                      <input
                        type="number"
                        min={10}
                        max={120}
                        value={cp.minimumReadSeconds}
                        onChange={(e) => updateCheckpoint(cp.id, { minimumReadSeconds: Number(e.target.value) })}
                        className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Done Editing
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-3">{cp.questionText}</p>
                    <div className="space-y-1.5 mb-3">
                      {cp.options.map((opt, i) => (
                        <div key={i} className={`text-xs px-3 py-1.5 rounded border ${
                          opt === cp.correctAnswer
                            ? "bg-green-50 border-green-200 text-green-800 font-medium"
                            : "bg-slate-50 border-slate-100 text-slate-600"
                        }`}>
                          {opt === cp.correctAnswer && <span className="mr-1">&#x2713;</span>}
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded p-2 mb-3">
                      <p className="text-xs text-blue-700">
                        <strong>On failure:</strong> {cp.failureHint}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  {cp.approvalStatus !== "approved" && (
                    <button
                      onClick={() => approveCheckpoint(cp.id)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      &#x2713; Approve
                    </button>
                  )}
                  {cp.approvalStatus !== "rejected" && (
                    <button
                      onClick={() => rejectCheckpoint(cp.id)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      &#x2717; Reject
                    </button>
                  )}
                  <button
                    onClick={() => setEditingId(isEditing ? null : cp.id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    &#x270F;&#xFE0F; Edit
                  </button>
                  {cp.approvedBy && (
                    <span className="text-xs text-slate-400 ml-auto">
                      Approved {cp.approvedAt ? new Date(cp.approvedAt).toLocaleDateString() : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    auto_generated: { bg: "bg-amber-100", text: "text-amber-700", label: "&#x1F916; Pending Review" },
    approved: { bg: "bg-green-100", text: "text-green-700", label: "&#x2705; Approved" },
    rejected: { bg: "bg-red-100", text: "text-red-700", label: "&#x274C; Rejected" },
    edited: { bg: "bg-blue-100", text: "text-blue-700", label: "&#x270F;&#xFE0F; Edited" },
  };
  const c = config[status] || config.auto_generated;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
      dangerouslySetInnerHTML={{ __html: c.label }}
    />
  );
}
