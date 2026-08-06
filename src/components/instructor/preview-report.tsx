"use client";

import type { PreviewModuleData } from "./preview-data";
import { previewResultStore } from "./preview-assessment";

interface Props {
  data: PreviewModuleData;
  onBack: () => void;
}

export function PreviewReport({ data, onBack }: Props) {
  const result = previewResultStore.result;
  const attemptAnswers = previewResultStore.answers;
  const { questions } = data;

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No assessment result available.</p>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-700 text-sm">Back to Overview</button>
      </div>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    READY: { bg: "bg-green-50 border-green-200", text: "text-green-800", icon: "\u2705", label: "Ready" },
    REVIEW_REQUIRED: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", icon: "\u26A0\uFE0F", label: "Review Required" },
    FURTHER_PREPARATION: { bg: "bg-red-50 border-red-200", text: "text-red-800", icon: "\uD83D\uDCD6", label: "Further Preparation" },
    ESCALATE: { bg: "bg-purple-50 border-purple-200", text: "text-purple-800", icon: "\uD83D\uDEA8", label: "Escalate" },
  };

  const status = statusConfig[result.status] || statusConfig.REVIEW_REQUIRED;

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border-2 p-6 ${status.bg}`}>
        <div className="flex items-start gap-4">
          <span className="text-3xl">{status.icon}</span>
          <div>
            <h1 className={`text-xl font-bold ${status.text}`}>{status.label}</h1>
            <p className={`mt-1 text-sm ${status.text} opacity-80`}>
              Preview result - this is what a learner would see.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">{Math.round(result.overallScore * 100)}%</div>
          <div className="text-sm text-slate-500 mt-1">Overall Score</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">{result.criticalFailures.length}</div>
          <div className="text-sm text-slate-500 mt-1">Critical Failures</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">{result.competencyScores.filter((c) => c.passed).length}/{result.competencyScores.length}</div>
          <div className="text-sm text-slate-500 mt-1">Competencies Met</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Competency Scores</h3>
        <div className="space-y-4">
          {result.competencyScores.map((cs) => (
            <div key={cs.competencyId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-900">{cs.competencyName}</span>
                <span className={`text-sm font-bold ${cs.passed ? "text-green-600" : "text-red-600"}`}>{Math.round(cs.score * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${cs.passed ? "bg-green-500" : "bg-red-400"}`} style={{ width: `${Math.round(cs.score * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Question Results</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const answer = attemptAnswers.find((a) => a.questionId === q.id);
            return (
              <div key={q.id} className={`p-3 rounded-lg border ${answer?.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-sm mt-0.5 ${answer?.isCorrect ? "text-green-600" : "text-red-600"}`}>{answer?.isCorrect ? "\u2713" : "\u2717"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Q{i + 1}: {q.questionText}</p>
                    {!answer?.isCorrect && <p className="text-xs text-slate-600 mt-1"><strong>Explanation:</strong> {q.explanation}</p>}
                  </div>
                  {q.critical && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex-shrink-0">Critical</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={onBack} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          Back to Module Overview
        </button>
      </div>
    </div>
  );
}
