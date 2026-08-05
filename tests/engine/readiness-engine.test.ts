import { describe, it, expect } from 'vitest';
import {
  calculateReadiness,
  type ReadinessEngineInput,
} from '@/lib/engine/readiness-engine';
import type {
  AssessmentQuestion,
  AttemptAnswer,
  Competency,
} from '@/lib/domain/types';

// --- Test Helpers ---

function makeCompetency(overrides: Partial<Competency> = {}): Competency {
  return {
    id: 'comp-1',
    moduleVersionId: 'mv-1',
    name: 'Test Competency',
    description: 'A test competency',
    weight: 1,
    minimumThreshold: 0.8,
    mandatory: false,
    critical: false,
    ...overrides,
  };
}

function makeQuestion(overrides: Partial<AssessmentQuestion> = {}): AssessmentQuestion {
  return {
    id: 'q-1',
    moduleVersionId: 'mv-1',
    competencyId: 'comp-1',
    questionText: 'What is 2+2?',
    questionType: 'multiple-choice',
    options: ['1', '2', '3', '4'],
    correctAnswer: '4',
    explanation: 'Basic arithmetic',
    critical: false,
    sourceReference: 'Math textbook',
    ...overrides,
  };
}

function makeAnswer(overrides: Partial<AttemptAnswer> = {}): AttemptAnswer {
  return {
    id: 'a-1',
    attemptId: 'attempt-1',
    questionId: 'q-1',
    selectedAnswer: '4',
    isCorrect: true,
    isCriticalFailure: false,
    ...overrides,
  };
}

/**
 * Generates a set of questions and answers for a competency with a specified
 * number correct out of total.
 */
function generateQuestionSet(params: {
  competencyId: string;
  total: number;
  correct: number;
  critical?: boolean;
  criticalFailureOnWrong?: boolean;
}): { questions: AssessmentQuestion[]; answers: AttemptAnswer[] } {
  const { competencyId, total, correct, critical = false, criticalFailureOnWrong = false } = params;
  const questions: AssessmentQuestion[] = [];
  const answers: AttemptAnswer[] = [];

  for (let i = 0; i < total; i++) {
    const qId = `${competencyId}-q-${i}`;
    const isCorrect = i < correct;

    questions.push(
      makeQuestion({
        id: qId,
        competencyId,
        critical,
        questionText: `Question ${i} for ${competencyId}`,
      })
    );

    answers.push(
      makeAnswer({
        id: `${competencyId}-a-${i}`,
        questionId: qId,
        selectedAnswer: isCorrect ? '4' : '1',
        isCorrect,
        isCriticalFailure: !isCorrect && criticalFailureOnWrong,
      })
    );
  }

  return { questions, answers };
}

function makeInput(overrides: Partial<ReadinessEngineInput> = {}): ReadinessEngineInput {
  const questions = [makeQuestion()];
  const answers = [makeAnswer()];
  const competencies = [makeCompetency()];

  return {
    attemptId: 'attempt-1',
    questions,
    answers,
    competencies,
    overallThreshold: 0.8,
    ...overrides,
  };
}

// --- Tests ---

describe('Readiness Engine - calculateReadiness', () => {
  describe('Status determination', () => {
    it('perfect score returns READY', () => {
      // 10/10 correct = 100% score
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 10,
      });
      const competencies = [makeCompetency({ id: 'comp-1' })];

      const result = calculateReadiness({
        attemptId: 'attempt-perfect',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).toBe('READY');
      expect(result.overallScore).toBe(1.0);
      expect(result.criticalFailures).toHaveLength(0);
    });

    it('zero score returns FURTHER_PREPARATION', () => {
      // 0/10 correct = 0% score
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 0,
      });
      const competencies = [makeCompetency({ id: 'comp-1' })];

      const result = calculateReadiness({
        attemptId: 'attempt-zero',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).toBe('FURTHER_PREPARATION');
      expect(result.overallScore).toBe(0);
    });

    it('exact threshold (80%) returns READY', () => {
      // 8/10 correct = exactly 80%
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 8,
      });
      const competencies = [makeCompetency({ id: 'comp-1', minimumThreshold: 0.8 })];

      const result = calculateReadiness({
        attemptId: 'attempt-threshold',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).toBe('READY');
      expect(result.overallScore).toBeCloseTo(0.8);
    });

    it('one point below threshold (79%) returns REVIEW_REQUIRED', () => {
      // We need a score just below 80% but above 80% * 0.75 = 60%
      // Use 100 questions to get precisely 79%
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 100,
        correct: 79,
      });
      const competencies = [makeCompetency({ id: 'comp-1', minimumThreshold: 0.8 })];

      const result = calculateReadiness({
        attemptId: 'attempt-below',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).toBe('REVIEW_REQUIRED');
      expect(result.overallScore).toBeCloseTo(0.79);
    });

    it('high score with critical failure returns REVIEW_REQUIRED (not READY)', () => {
      // 9/10 correct but one critical failure on the wrong answer
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 9,
        critical: true,
        criticalFailureOnWrong: true,
      });
      const competencies = [makeCompetency({ id: 'comp-1' })];

      const result = calculateReadiness({
        attemptId: 'attempt-critical',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).toBe('REVIEW_REQUIRED');
      expect(result.overallScore).toBeCloseTo(0.9);
      expect(result.criticalFailures.length).toBeGreaterThan(0);
    });

    it('multiple critical failures returns REVIEW_REQUIRED', () => {
      // 8/10 correct but 2 critical failures
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 8,
        critical: true,
        criticalFailureOnWrong: true,
      });
      const competencies = [makeCompetency({ id: 'comp-1' })];

      const result = calculateReadiness({
        attemptId: 'attempt-multi-critical',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).toBe('REVIEW_REQUIRED');
      expect(result.criticalFailures.length).toBe(2);
    });

    it('mandatory competency below threshold returns not READY (REVIEW_REQUIRED)', () => {
      // Competency is mandatory with 80% threshold, score is 70%
      // Overall score is above 0.8 * 0.6 = 0.48 so should be REVIEW_REQUIRED
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 7,
      });
      const competencies = [
        makeCompetency({ id: 'comp-1', mandatory: true, minimumThreshold: 0.8 }),
      ];

      const result = calculateReadiness({
        attemptId: 'attempt-mandatory-fail',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).not.toBe('READY');
      expect(result.status).toBe('REVIEW_REQUIRED');
    });

    it('mandatory competency far below threshold returns FURTHER_PREPARATION', () => {
      // Overall score below overallThreshold * 0.6 = 0.48
      // 4/10 correct = 0.4 (below 0.48)
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 4,
      });
      const competencies = [
        makeCompetency({ id: 'comp-1', mandatory: true, minimumThreshold: 0.8 }),
      ];

      const result = calculateReadiness({
        attemptId: 'attempt-mandatory-far-below',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).toBe('FURTHER_PREPARATION');
    });

    it('score in REVIEW_REQUIRED range (between 60% and 80%) returns REVIEW_REQUIRED', () => {
      // Score = 70% is between threshold*0.75=60% and threshold=80%
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 7,
      });
      const competencies = [makeCompetency({ id: 'comp-1', minimumThreshold: 0.5 })];

      const result = calculateReadiness({
        attemptId: 'attempt-review',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.status).toBe('REVIEW_REQUIRED');
    });
  });

  describe('Validation and error handling', () => {
    it('incomplete attempt throws error (fewer answers than questions)', () => {
      const questions = [
        makeQuestion({ id: 'q-1' }),
        makeQuestion({ id: 'q-2' }),
      ];
      const answers = [makeAnswer({ questionId: 'q-1' })]; // Only 1 answer for 2 questions

      expect(() =>
        calculateReadiness({
          attemptId: 'attempt-incomplete',
          questions,
          answers,
          competencies: [makeCompetency()],
        })
      ).toThrow('Incomplete attempt');
    });

    it('incomplete attempt throws error (more answers than questions)', () => {
      const questions = [makeQuestion({ id: 'q-1' })];
      const answers = [
        makeAnswer({ id: 'a-1', questionId: 'q-1' }),
        makeAnswer({ id: 'a-2', questionId: 'q-1' }),
      ];

      expect(() =>
        calculateReadiness({
          attemptId: 'attempt-extra',
          questions,
          answers,
          competencies: [makeCompetency()],
        })
      ).toThrow('Incomplete attempt');
    });

    it('unknown question IDs are rejected', () => {
      const questions = [makeQuestion({ id: 'q-1' })];
      const answers = [makeAnswer({ questionId: 'q-unknown' })];

      expect(() =>
        calculateReadiness({
          attemptId: 'attempt-unknown',
          questions,
          answers,
          competencies: [makeCompetency()],
        })
      ).toThrow('Unknown question ID');
    });

    it('duplicate question IDs in answers are rejected', () => {
      const questions = [
        makeQuestion({ id: 'q-1' }),
        makeQuestion({ id: 'q-2' }),
      ];
      const answers = [
        makeAnswer({ id: 'a-1', questionId: 'q-1' }),
        makeAnswer({ id: 'a-2', questionId: 'q-1' }), // Duplicate
      ];

      expect(() =>
        calculateReadiness({
          attemptId: 'attempt-dup',
          questions,
          answers,
          competencies: [makeCompetency()],
        })
      ).toThrow('Duplicate answer');
    });

    it('invalid competency weights (zero total) are handled gracefully', () => {
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 5,
        correct: 5,
      });
      const competencies = [
        makeCompetency({ id: 'comp-1', weight: 0 }),
      ];

      // Should not crash, returns a result with 0 overall score
      const result = calculateReadiness({
        attemptId: 'attempt-zero-weight',
        questions,
        answers,
        competencies,
      });

      expect(result).toBeDefined();
      expect(result.overallScore).toBe(0);
      expect(result.status).toBeDefined();
    });
  });

  describe('Determinism', () => {
    it('deterministic repeat execution (same input produces same output)', () => {
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 7,
      });
      const competencies = [
        makeCompetency({ id: 'comp-1', mandatory: true }),
      ];

      const input: ReadinessEngineInput = {
        attemptId: 'attempt-deterministic',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      };

      const result1 = calculateReadiness(input);
      const result2 = calculateReadiness(input);
      const result3 = calculateReadiness(input);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });

  describe('Result structure', () => {
    it('returns proper result structure with all fields', () => {
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 5,
        correct: 5,
      });
      const competencies = [makeCompetency({ id: 'comp-1' })];

      const result = calculateReadiness({
        attemptId: 'attempt-structure',
        questions,
        answers,
        competencies,
      });

      expect(result.id).toBe('result-attempt-structure');
      expect(result.attemptId).toBe('attempt-structure');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.status).toMatch(/^(READY|REVIEW_REQUIRED|FURTHER_PREPARATION|ESCALATE)$/);
      expect(Array.isArray(result.competencyScores)).toBe(true);
      expect(Array.isArray(result.criticalFailures)).toBe(true);
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.reviewAreas)).toBe(true);
      expect(Array.isArray(result.remediationActions)).toBe(true);
    });

    it('generates remediation actions for failed competencies', () => {
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 3,
      });
      const competencies = [makeCompetency({ id: 'comp-1', name: 'Safety Basics' })];

      const result = calculateReadiness({
        attemptId: 'attempt-remediation',
        questions,
        answers,
        competencies,
      });

      expect(result.remediationActions.length).toBeGreaterThan(0);
      expect(result.remediationActions[0].competencyName).toBe('Safety Basics');
      expect(result.reviewAreas).toContain('Safety Basics');
    });

    it('identifies strengths for high-performing competencies', () => {
      const { questions, answers } = generateQuestionSet({
        competencyId: 'comp-1',
        total: 10,
        correct: 10,
      });
      const competencies = [makeCompetency({ id: 'comp-1', name: 'Core Knowledge' })];

      const result = calculateReadiness({
        attemptId: 'attempt-strengths',
        questions,
        answers,
        competencies,
      });

      expect(result.strengths).toContain('Core Knowledge');
    });
  });

  describe('Multi-competency scenarios', () => {
    it('handles multiple competencies with different weights', () => {
      // Competency 1: weight 3, 100% score
      // Competency 2: weight 1, 0% score
      // Weighted: (1.0*3 + 0.0*1) / 4 = 0.75
      const set1 = generateQuestionSet({ competencyId: 'comp-1', total: 5, correct: 5 });
      const set2 = generateQuestionSet({ competencyId: 'comp-2', total: 5, correct: 0 });

      const questions = [...set1.questions, ...set2.questions];
      const answers = [...set1.answers, ...set2.answers];
      const competencies = [
        makeCompetency({ id: 'comp-1', weight: 3, name: 'Strong Area' }),
        makeCompetency({ id: 'comp-2', weight: 1, name: 'Weak Area', minimumThreshold: 0.5 }),
      ];

      const result = calculateReadiness({
        attemptId: 'attempt-multi',
        questions,
        answers,
        competencies,
        overallThreshold: 0.8,
      });

      expect(result.overallScore).toBeCloseTo(0.75);
      expect(result.competencyScores).toHaveLength(2);
      expect(result.competencyScores.find(cs => cs.competencyId === 'comp-1')?.score).toBe(1.0);
      expect(result.competencyScores.find(cs => cs.competencyId === 'comp-2')?.score).toBe(0);
    });
  });
});
