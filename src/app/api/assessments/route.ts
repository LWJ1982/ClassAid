export const runtime = "edge";
import { NextRequest } from "next/server";
import { getEnv, jsonResponse, errorResponse, generateId } from "@/lib/api-helpers";

/**
 * POST /api/assessments
 * Submit assessment answers — server-side scoring with critical-rule engine
 *
 * Security:
 * - Scores are NEVER accepted from the browser
 * - Correct answers loaded server-side from D1
 * - Critical rules applied deterministically
 * - Result is immutable once created
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, learnerId, answers } = body;

    if (!moduleId || !learnerId || !answers || !Array.isArray(answers)) {
      return errorResponse("moduleId, learnerId, and answers array are required");
    }

    const env = getEnv();
    if (!env) {
      // Fallback: use in-memory scoring (already handled client-side)
      return errorResponse("Server-side scoring requires Cloudflare D1 binding", 503);
    }

    // 1. Load module configuration
    const moduleRecord = await env.DB.prepare(
      "SELECT * FROM modules WHERE id = ? AND status = 'published'"
    ).bind(moduleId).first();

    if (!moduleRecord) {
      return errorResponse("Module not found or not published", 404);
    }

    // 2. Load authoritative questions (assessment kind only, approved)
    const questionsResult = await env.DB.prepare(
      "SELECT * FROM questions WHERE module_id = ? AND question_kind = 'assessment' AND approval_status = 'approved'"
    ).bind(moduleId).all();

    const questions = questionsResult.results;

    if (questions.length === 0) {
      return errorResponse("No approved assessment questions found for this module", 404);
    }

    // 3. Validate all questions are answered
    const questionIds = new Set(questions.map((q) => q.id as string));
    const answeredIds = new Set(answers.map((a: { questionId: string }) => a.questionId));

    for (const qId of questionIds) {
      if (!answeredIds.has(qId)) {
        return errorResponse(`Missing answer for question: ${qId}`);
      }
    }

    // Reject unknown question IDs
    for (const a of answers) {
      if (!questionIds.has(a.questionId)) {
        return errorResponse(`Unknown question ID: ${a.questionId}`);
      }
    }

    // Check for duplicates
    if (answeredIds.size !== answers.length) {
      return errorResponse("Duplicate answers detected");
    }

    // 4. Load competencies for scoring
    const competenciesResult = await env.DB.prepare(
      "SELECT * FROM competencies WHERE module_id = ?"
    ).bind(moduleId).all();

    const competencies = competenciesResult.results;

    // 5. Score each answer server-side
    const attemptId = generateId("attempt");
    const attemptAnswers: {
      id: string;
      questionId: string;
      selected: string;
      isCorrect: boolean;
      isCriticalFailure: boolean;
    }[] = [];

    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = answer.selectedAnswer === question.correct_answer;
      const isCriticalFailure = (question.critical as number) === 1 && !isCorrect;

      attemptAnswers.push({
        id: generateId("ans"),
        questionId: answer.questionId,
        selected: answer.selectedAnswer,
        isCorrect,
        isCriticalFailure,
      });
    }

    // 6. Calculate competency scores
    const competencyScores = competencies.map((comp) => {
      const compQuestions = questions.filter((q) => q.competency_id === comp.id);
      const compAnswers = attemptAnswers.filter((a) =>
        compQuestions.some((q) => q.id === a.questionId)
      );
      const correctCount = compAnswers.filter((a) => a.isCorrect).length;
      const score = compQuestions.length > 0 ? correctCount / compQuestions.length : 0;

      return {
        competencyId: comp.id as string,
        competencyName: comp.name as string,
        score,
        threshold: comp.min_threshold as number,
        passed: score >= (comp.min_threshold as number),
        mandatory: (comp.mandatory as number) === 1,
        critical: (comp.critical as number) === 1,
      };
    });

    // 7. Calculate weighted overall score
    const totalWeight = competencies.reduce((sum, c) => sum + (c.weight as number), 0);
    const overallScore = totalWeight > 0
      ? competencies.reduce((sum, comp) => {
          const cs = competencyScores.find((s) => s.competencyId === comp.id);
          return sum + (cs?.score ?? 0) * (comp.weight as number);
        }, 0) / totalWeight
      : 0;

    // 8. Identify critical failures
    const criticalFailures = attemptAnswers
      .filter((a) => a.isCriticalFailure)
      .map((a) => {
        const q = questions.find((qq) => qq.id === a.questionId);
        const c = competencies.find((cc) => cc.id === q?.competency_id);
        return (c?.name as string) || "Critical failure";
      });

    // 9. Determine status (deterministic — AI cannot affect this)
    const overallThreshold = moduleRecord.overall_threshold as number;
    let status: string;

    if (criticalFailures.length > 0) {
      status = "REVIEW_REQUIRED";
    } else if (competencyScores.some((cs) => cs.mandatory && !cs.passed)) {
      status = overallScore < overallThreshold * 0.6 ? "FURTHER_PREPARATION" : "REVIEW_REQUIRED";
    } else if (overallScore >= overallThreshold) {
      status = "READY";
    } else if (overallScore >= overallThreshold * 0.75) {
      status = "REVIEW_REQUIRED";
    } else {
      status = "FURTHER_PREPARATION";
    }

    // 10. Persist attempt, answers, and result
    await env.DB.prepare(
      `INSERT INTO attempts (id, learner_id, module_id, module_version, submitted_at, status, overall_score)
       VALUES (?, ?, ?, ?, datetime('now'), 'scored', ?)`
    ).bind(attemptId, learnerId, moduleId, moduleRecord.version as string, overallScore).run();

    for (const ans of attemptAnswers) {
      await env.DB.prepare(
        `INSERT INTO attempt_answers (id, attempt_id, question_id, selected_answer, is_correct, is_critical_failure)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(ans.id, attemptId, ans.questionId, ans.selected, ans.isCorrect ? 1 : 0, ans.isCriticalFailure ? 1 : 0).run();
    }

    const strengths = competencyScores.filter((cs) => cs.passed && cs.score >= 0.8).map((cs) => cs.competencyName);
    const reviewAreas = competencyScores.filter((cs) => !cs.passed).map((cs) => cs.competencyName);
    const remediation = competencyScores
      .filter((cs) => !cs.passed)
      .map((cs) => ({ competencyName: cs.competencyName, action: `Review material related to ${cs.competencyName}.` }));

    const resultId = generateId("result");
    await env.DB.prepare(
      `INSERT INTO results (id, attempt_id, overall_score, status, competency_scores, critical_failures, strengths, review_areas, remediation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      resultId, attemptId, overallScore, status,
      JSON.stringify(competencyScores),
      JSON.stringify(criticalFailures),
      JSON.stringify(strengths),
      JSON.stringify(reviewAreas),
      JSON.stringify(remediation),
    ).run();

    // 11. Audit event
    await env.DB.prepare(
      `INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, details)
       VALUES (?, ?, 'ASSESSMENT_SUBMITTED', 'attempt', ?, ?)`
    ).bind(generateId("audit"), learnerId, attemptId, `Score: ${Math.round(overallScore * 100)}%, Status: ${status}`).run();

    return jsonResponse({
      attemptId,
      resultId,
      overallScore,
      status,
      competencyScores,
      criticalFailures,
      strengths,
      reviewAreas,
      remediation,
    });
  } catch (error) {
    console.error("Assessment error:", error);
    return errorResponse("Failed to process assessment. Please try again.", 500);
  }
}
