/**
 * Deterministic Readiness Engine
 * 
 * Rules:
 * - AI cannot affect status
 * - Critical failures prevent READY regardless of score
 * - Mandatory competency thresholds must be met
 * - Overall threshold (default 80%) must be met
 * - Incomplete attempts are rejected
 */

import type {
  AssessmentQuestion,
  AttemptAnswer,
  Competency,
  CompetencyScore,
  ReadinessResult,
  ReadinessStatus,
  RemediationAction,
} from '../domain/types';

export interface ReadinessEngineInput {
  attemptId: string;
  questions: AssessmentQuestion[];
  answers: AttemptAnswer[];
  competencies: Competency[];
  overallThreshold?: number; // default 0.8
}

export function calculateReadiness(input: ReadinessEngineInput): ReadinessResult {
  const { attemptId, questions, answers, competencies, overallThreshold = 0.8 } = input;

  // Reject incomplete attempts
  if (answers.length !== questions.length) {
    throw new Error(
      `Incomplete attempt: expected ${questions.length} answers, received ${answers.length}`
    );
  }

  // Validate all question IDs match
  const questionIds = new Set(questions.map((q) => q.id));
  for (const answer of answers) {
    if (!questionIds.has(answer.questionId)) {
      throw new Error(`Unknown question ID: ${answer.questionId}`);
    }
  }

  // Check for duplicates
  const answeredIds = new Set<string>();
  for (const answer of answers) {
    if (answeredIds.has(answer.questionId)) {
      throw new Error(`Duplicate answer for question: ${answer.questionId}`);
    }
    answeredIds.add(answer.questionId);
  }

  // Calculate competency scores
  const competencyScores: CompetencyScore[] = competencies.map((comp) => {
    const compQuestions = questions.filter((q) => q.competencyId === comp.id);
    const compAnswers = answers.filter((a) =>
      compQuestions.some((q) => q.id === a.questionId)
    );

    const correctCount = compAnswers.filter((a) => a.isCorrect).length;
    const score = compQuestions.length > 0 ? correctCount / compQuestions.length : 0;

    return {
      competencyId: comp.id,
      competencyName: comp.name,
      score,
      threshold: comp.minimumThreshold,
      passed: score >= comp.minimumThreshold,
      mandatory: comp.mandatory,
      critical: comp.critical,
    };
  });

  // Calculate weighted overall score
  const totalWeight = competencies.reduce((sum, c) => sum + c.weight, 0);
  const overallScore =
    totalWeight > 0
      ? competencies.reduce((sum, comp) => {
          const compScore = competencyScores.find(
            (cs) => cs.competencyId === comp.id
          );
          return sum + (compScore?.score ?? 0) * comp.weight;
        }, 0) / totalWeight
      : 0;

  // Identify critical failures
  const criticalFailures: string[] = [];
  for (const answer of answers) {
    if (answer.isCriticalFailure) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (question) {
        const comp = competencies.find((c) => c.id === question.competencyId);
        criticalFailures.push(
          comp?.name ?? question.questionText
        );
      }
    }
  }

  // Determine status
  const status = determineStatus(
    overallScore,
    overallThreshold,
    competencyScores,
    criticalFailures
  );

  // Generate strengths and review areas
  const strengths = competencyScores
    .filter((cs) => cs.passed && cs.score >= 0.8)
    .map((cs) => cs.competencyName);

  const reviewAreas = competencyScores
    .filter((cs) => !cs.passed)
    .map((cs) => cs.competencyName);

  // Generate remediation
  const remediationActions: RemediationAction[] = competencyScores
    .filter((cs) => !cs.passed)
    .map((cs) => {
      const comp = competencies.find((c) => c.id === cs.competencyId);
      return {
        competencyId: cs.competencyId,
        competencyName: cs.competencyName,
        action: `Review material related to ${cs.competencyName}. Focus on understanding core concepts and procedures.`,
        sourceReference: comp
          ? `Module source material - ${comp.name} section`
          : 'Module source material',
      };
    });

  // Add critical failure remediation
  if (criticalFailures.length > 0) {
    remediationActions.unshift({
      competencyId: 'critical',
      competencyName: 'Critical Safety/Compliance',
      action:
        'Review all critical safety and compliance material. Understanding these concepts is mandatory before proceeding.',
      sourceReference: 'Safety and Compliance Guidelines',
    });
  }

  return {
    id: `result-${attemptId}`,
    attemptId,
    overallScore,
    status,
    competencyScores,
    criticalFailures,
    strengths,
    reviewAreas,
    remediationActions,
  };
}

function determineStatus(
  overallScore: number,
  overallThreshold: number,
  competencyScores: CompetencyScore[],
  criticalFailures: string[]
): ReadinessStatus {
  // Critical failures ALWAYS prevent READY
  if (criticalFailures.length > 0) {
    return 'REVIEW_REQUIRED';
  }

  // Check mandatory competency thresholds
  const mandatoryFailed = competencyScores.some(
    (cs) => cs.mandatory && !cs.passed
  );
  if (mandatoryFailed) {
    if (overallScore < overallThreshold * 0.6) {
      return 'FURTHER_PREPARATION';
    }
    return 'REVIEW_REQUIRED';
  }

  // Check overall threshold
  if (overallScore >= overallThreshold) {
    return 'READY';
  }

  // Determine severity
  if (overallScore >= overallThreshold * 0.75) {
    return 'REVIEW_REQUIRED';
  }

  return 'FURTHER_PREPARATION';
}
