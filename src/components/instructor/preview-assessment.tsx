"use client";

import { useState } from "react";
import { calculateReadiness } from "@/lib/engine/readiness-engine";
import type { PreviewModuleData } from "./preview-data";
import type { AttemptAnswer, ReadinessResult } from "@/lib/domain/types";

interface Props {
  data: PreviewModuleData;
  onComplete: (result: ReadinessResult, answers: AttemptAnswer[]) => void;
  onBack: () => void;
}

export function PreviewAssessment({ data, onComplete, onBack }: Props) {
  const { questions, competencies } = data;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;
  const question = questions[currentQuestion];

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitting(true);
    setTimeout(() => {
      const attemptAnswers: AttemptAnswer[] = questions.map((q) => {
        const selected = answers[q.id];
        const isCorrect = selected === q.correctAnswer;
        return {
          id: `preview-ans-${q.id}`,
          attemptId: "preview-attempt",
          questionId: q.id,
          selectedAnswer: selected,
          isCorrect,
          isCriticalFailure: q.critical && !isCorrect,
        };
      });
      const readinessResult = calculateReadiness({
        attemptId: "preview-attempt",
        questions,
        answers: attemptAnswers,
        competencies,
        overallThreshold: 0.8,
      });
      setSubmitting(false);
      onComplete(readinessResult, attemptAnswers);
    }, 800);
  };

  if (showReview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Review Your Answers</h2>
          <button onClick={() => setShowReview(false)} className="text-sm text-blue-600 hover:text-blue-700">Back to Questions</button>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className={`bg-white border rounded-lg p-4 ${!answers[q.id] ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
              <p className="text-sm font-medium text-slate-900">Q{i + 1}: {q.questionText}</p>
              {answers[q.id] ? (
                <p className="text-sm text-slate-600 mt-1">{answers[q.id]}</p>
              ) : (
                <p className="text-sm text-amber-600 mt-1 font-medium">Not answered</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <button onClick={handleSubmit} disabled={!allAnswered || submitting} className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-40">
            {submitting ? "Scoring..." : "Submit Assessment"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{answeredCount}/{questions.length} answered</span>
          {allAnswered && <button onClick={() => setShowReview(true)} className="text-sm text-blue-600 font-medium">Review &amp; Submit</button>}
        </div>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">{currentQuestion + 1}</span>
          <span className="text-sm text-slate-500">of {questions.length}</span>
          {question.critical && <span className="ml-auto text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">Critical</span>}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-6">{question.questionText}</h3>
        <div className="space-y-3">
          {question.options.map((option, i) => (
            <button key={i} onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))} className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[question.id] === option ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 hover:border-slate-300 text-slate-700"}`}>
              <span className="text-sm">{option}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))} disabled={currentQuestion === 0} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40">Previous</button>
        {currentQuestion < questions.length - 1 ? (
          <button onClick={() => setCurrentQuestion(currentQuestion + 1)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Next</button>
        ) : (
          <button onClick={() => setShowReview(true)} disabled={!allAnswered} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40">Review</button>
        )}
      </div>
    </div>
  );
}
