"use client";

import { useState } from "react";
import { useApp } from "../providers";
import { apiClient } from "@/lib/api-client";

export function QuestionGenerator() {
  const { currentUser } = useApp();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ generated: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questionKind, setQuestionKind] = useState<"checkpoint" | "assessment">("checkpoint");

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.generateQuestions({
        moduleId: "module-1",
        requestedBy: currentUser.id,
        questionKind,
      });

      setResult({
        generated: response.generated,
        message: response.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Question generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Auto-Generate Questions</h3>
        <p className="text-sm text-slate-500 mt-1">
          Use AI to generate questions from uploaded source material. Generated questions
          require your approval before being shown to learners.
        </p>
      </div>

      {/* Question kind selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setQuestionKind("checkpoint")}
          className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
            questionKind === "checkpoint"
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-900">&#x1F512; Checkpoint Questions</p>
          <p className="text-xs text-slate-500 mt-1">
            Comprehension gates for guided activity steps. Learners must pass to proceed.
          </p>
        </button>
        <button
          onClick={() => setQuestionKind("assessment")}
          className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
            questionKind === "assessment"
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-900">&#x1F4DD; Assessment Questions</p>
          <p className="text-xs text-slate-500 mt-1">
            Final readiness assessment questions. Scored for competency and readiness status.
          </p>
        </button>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating {questionKind} questions...
          </>
        ) : (
          <>
            &#x1F916; Generate {questionKind === "checkpoint" ? "Checkpoint" : "Assessment"} Questions
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">&#x2705; {result.message}</p>
          <p className="text-xs text-green-600 mt-1">
            Go to &quot;Checkpoint Approval&quot; tab to review and approve the generated questions.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">&#x274C; {error}</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-700">
          <strong>&#x26A0;&#xFE0F; Instructor approval required:</strong> Generated questions are stored as
          &quot;Pending Review&quot; and are NOT visible to learners until you explicitly approve them.
          The AI generates from your uploaded source material only.
        </p>
      </div>
    </div>
  );
}
