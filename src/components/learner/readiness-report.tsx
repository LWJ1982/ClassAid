"use client";

import { useApp } from "../providers";

interface Props {
  onRetry: () => void;
  onBackToDashboard: () => void;
}

export function ReadinessReport({ onRetry, onBackToDashboard }: Props) {
  const { readinessResult, attemptAnswers, resetAssessment, moduleConfig } = useApp();
  const questions = moduleConfig.questions;

  if (!readinessResult) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No assessment result available.</p>
        <button onClick={onBackToDashboard} className="mt-4 text-blue-600 hover:text-blue-700 text-sm">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string; message: string }> = {
    READY: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-800",
      icon: "\u2705",
      label: "Ready for Supervised Activity",
      message: "Foundational readiness demonstrated for the assessed scope. You may proceed to the scheduled session.",
    },
    REVIEW_REQUIRED: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      icon: "\u26A0\uFE0F",
      label: "Review Required",
      message: "Complete the specified remediation below and reassess before progressing to the session.",
    },
    FURTHER_PREPARATION: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      icon: "\uD83D\uDCD6",
      label: "Further Preparation Required",
      message: "Revisit foundational material and seek instructor support where indicated.",
    },
    ESCALATE: {
      bg: "bg-purple-50 border-purple-200",
      text: "text-purple-800",
      icon: "\uD83D\uDEA8",
      label: "Escalate to Instructor",
      message: "Stop and consult the authorised instructor or responsible owner before proceeding.",
    },
  };

  const status = statusConfig[readinessResult.status] || statusConfig.REVIEW_REQUIRED;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`rounded-xl border-2 p-6 ${status.bg}`}>
        <div className="flex items-start gap-4">
          <span className="text-3xl">{status.icon}</span>
          <div>
            <h1 className={`text-xl font-bold ${status.text}`}>{status.label}</h1>
            <p className={`mt-1 text-sm ${status.text} opacity-80`}>{status.message}</p>
          </div>
        </div>
      </div>

      {/* Score overview */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">
            {Math.round(readinessResult.overallScore * 100)}%
          </div>
          <div className="text-sm text-slate-500 mt-1">Overall Score</div>
          <div className="text-xs text-slate-400 mt-0.5">Threshold: 80%</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">
            {readinessResult.criticalFailures.length}
          </div>
          <div className="text-sm text-slate-500 mt-1">Critical Failures</div>
          <div className="text-xs text-slate-400 mt-0.5">Must be zero for Ready</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-3xl font-bold text-slate-900">
            {readinessResult.competencyScores.filter((c) => c.passed).length}/{readinessResult.competencyScores.length}
          </div>
          <div className="text-sm text-slate-500 mt-1">Competencies Met</div>
          <div className="text-xs text-slate-400 mt-0.5">All mandatory required</div>
        </div>
      </div>

      {/* Critical failures */}
      {readinessResult.criticalFailures.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
            <span>\u26D4</span> Critical Failures
          </h3>
          <p className="text-xs text-red-600 mt-1 mb-3">
            Critical failures prevent a Ready outcome regardless of overall score.
          </p>
          <ul className="space-y-2">
            {readinessResult.criticalFailures.map((failure, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                <span className="text-red-400 mt-0.5">\u2022</span>
                {failure}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competency breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Competency Scores</h3>
        <div className="space-y-4">
          {readinessResult.competencyScores.map((cs) => (
            <div key={cs.competencyId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900">{cs.competencyName}</span>
                  {cs.critical && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Critical</span>}
                  {cs.mandatory && !cs.critical && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Mandatory</span>}
                </div>
                <span className={`text-sm font-bold ${cs.passed ? "text-green-600" : "text-red-600"}`}>
                  {Math.round(cs.score * 100)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${cs.passed ? "bg-green-500" : "bg-red-400"}`}
                  style={{ width: `${Math.round(cs.score * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-xs text-slate-400">
                  {cs.passed ? "\u2713 Met" : "\u2717 Below threshold"}
                </span>
                <span className="text-xs text-slate-400">Min: {Math.round(cs.threshold * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Question results */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Question Results</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const answer = attemptAnswers.find((a) => a.questionId === q.id);
            return (
              <div key={q.id} className={`p-3 rounded-lg border ${answer?.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-sm mt-0.5 ${answer?.isCorrect ? "text-green-600" : "text-red-600"}`}>
                    {answer?.isCorrect ? "\u2713" : "\u2717"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">Q{i + 1}: {q.questionText}</p>
                    {!answer?.isCorrect && (
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      Source: {q.sourceReference}
                    </p>
                  </div>
                  {q.critical && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex-shrink-0">Critical</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Remediation */}
      {readinessResult.remediationActions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recommended Actions</h3>
          <div className="space-y-3">
            {readinessResult.remediationActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{action.competencyName}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{action.action}</p>
                  <p className="text-xs text-slate-400 mt-1">\uD83D\uDCC4 {action.sourceReference}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        {readinessResult.status !== "READY" && (
          <button
            onClick={() => { resetAssessment(); onRetry(); }}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reassess
          </button>
        )}
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center px-5 py-2.5 bg-white text-slate-700 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-500 italic">
          <strong>Disclaimer:</strong> This readiness assessment evaluates configured foundational knowledge.
          It does not certify practical competence, guarantee real-world safety compliance, or replace
          instructor supervision during hands-on activities. Status is advisory within the assessed scope.
        </p>
      </div>
    </div>
  );
}
