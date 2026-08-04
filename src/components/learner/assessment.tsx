"use client";

import { useState } from "react";
import { calculateReadiness } from "@/lib/engine/readiness-engine";
import { useApp } from "../providers";
import type { AttemptAnswer } from "@/lib/domain/types";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export function Assessment({ onComplete, onBack }: Props) {
  const { assessmentAnswers, setAssessmentAnswer, setReadinessResult, setAttemptAnswers, setAssessmentSubmitted, moduleConfig } = useApp();
  const questions = moduleConfig.questions;
  const competencies = moduleConfig.competencies;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const answeredCount = Object.keys(assessmentAnswers).length;
  const allAnswered = answeredCount === questions.length;
  const question = questions[currentQuestion];

  const handleSubmit = () => {
    if (!allAnswered) {
      setError("All questions must be answered before submission.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // Simulate server-side scoring
    setTimeout(() => {
      try {
        const attemptAnswers: AttemptAnswer[] = questions.map((q) => {
          const selected = assessmentAnswers[q.id];
          const isCorrect = selected === q.correctAnswer;
          const isCriticalFailure = q.critical && !isCorrect;
          return {
            id: `ans-${q.id}`,
            attemptId: "attempt-1",
            questionId: q.id,
            selectedAnswer: selected,
            isCorrect,
            isCriticalFailure,
          };
        });

        const result = calculateReadiness({
          attemptId: "attempt-1",
          questions,
          answers: attemptAnswers,
          competencies,
          overallThreshold: moduleConfig.overallThreshold,
        });

        setAttemptAnswers(attemptAnswers);
        setReadinessResult(result);
        setAssessmentSubmitted(true);
        setSubmitting(false);
        onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scoring failed. Please try again.");
        setSubmitting(false);
      }
    }, 1200);
  };

  if (showReview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Review Your Answers</h2>
          <button onClick={() => setShowReview(false)} className="text-sm text-blue-600 hover:text-blue-700">
            Back to Questions
          </button>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const answered = assessmentAnswers[q.id];
            return (
              <div key={q.id} className={`bg-white border rounded-lg p-4 ${!answered ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Q{i + 1}: {q.questionText}
                    </p>
                    {answered ? (
                      <p className="text-sm text-slate-600 mt-1">\u2713 {answered}</p>
                    ) : (
                      <p className="text-sm text-amber-600 mt-1 font-medium">Not answered</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setCurrentQuestion(i); setShowReview(false); }}
                    className="text-xs text-blue-600 hover:text-blue-700 ml-2"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scoring...
              </>
            ) : (
              "Submit Assessment"
            )}
          </button>
        </div>

        <p className="text-xs text-center text-slate-400">
          Answers are scored server-side. Results cannot be altered after submission.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Coach
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {answeredCount}/{questions.length} answered
          </span>
          {allAnswered && (
            <button
              onClick={() => setShowReview(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Review & Submit
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
            {currentQuestion + 1}
          </span>
          <span className="text-sm text-slate-500">of {questions.length}</span>
          {question.critical && (
            <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-xs font-medium ml-auto">
              Critical
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          {question.questionText}
        </h3>

        <div className="space-y-3">
          {question.options.map((option, i) => {
            const isSelected = assessmentAnswers[question.id] === option;
            return (
              <button
                key={i}
                onClick={() => setAssessmentAnswer(question.id, option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected ? "border-blue-500 bg-blue-500" : "border-slate-300"
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(i)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                i === currentQuestion
                  ? "bg-blue-600 text-white"
                  : assessmentAnswers[q.id]
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentQuestion < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => setShowReview(true)}
            disabled={!allAnswered}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Review
          </button>
        )}
      </div>
    </div>
  );
}
