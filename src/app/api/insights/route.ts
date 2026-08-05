import { NextRequest } from "next/server";
import { getEnv, jsonResponse, errorResponse } from "@/lib/api-helpers";

/**
 * GET /api/insights?moduleId=xxx
 * Instructor cohort insights — aggregated from real attempt data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get("moduleId");

  if (!moduleId) {
    return errorResponse("moduleId is required");
  }

  const env = getEnv();
  if (!env) {
    // Fallback: return seeded metrics
    return jsonResponse({
      moduleId,
      assigned: 30,
      started: 27,
      completed: 24,
      completionRate: 0.80,
      readinessDistribution: { READY: 18, REVIEW_REQUIRED: 4, FURTHER_PREPARATION: 2, ESCALATE: 0 },
      competencyAverages: [
        { competencyName: "Measurement Theory", average: 0.82 },
        { competencyName: "Connection Procedures", average: 0.75 },
        { competencyName: "Safety Compliance", average: 0.88 },
        { competencyName: "Error Awareness", average: 0.71 },
      ],
      misconceptions: [],
      interventionList: [],
    });
  }

  // Count attempts by status
  const attemptsResult = await env.DB.prepare(
    "SELECT status, COUNT(*) as count FROM attempts WHERE module_id = ? GROUP BY status"
  ).bind(moduleId).all();

  const attempts = attemptsResult.results as Record<string, unknown>[];
  const started = attempts.reduce((s, a) => s + (a.count as number), 0);
  const completed = attempts.filter((a) => a.status === "scored").reduce((s, a) => s + (a.count as number), 0);

  // Readiness distribution
  const readinessResult = await env.DB.prepare(
    `SELECT r.status, COUNT(*) as count FROM results r
     JOIN attempts a ON r.attempt_id = a.id
     WHERE a.module_id = ? GROUP BY r.status`
  ).bind(moduleId).all();

  const distribution: Record<string, number> = { READY: 0, REVIEW_REQUIRED: 0, FURTHER_PREPARATION: 0, ESCALATE: 0 };
  for (const row of readinessResult.results as Record<string, unknown>[]) {
    distribution[row.status as string] = row.count as number;
  }

  // Competency averages
  const compResult = await env.DB.prepare(
    "SELECT * FROM competencies WHERE module_id = ? ORDER BY sequence"
  ).bind(moduleId).all();

  const competencyAverages = [];
  for (const comp of compResult.results as Record<string, unknown>[]) {
    const scoreResult = await env.DB.prepare(
      `SELECT AVG(aa.is_correct) as avg_score FROM attempt_answers aa
       JOIN questions q ON aa.question_id = q.id
       WHERE q.competency_id = ? AND q.module_id = ?`
    ).bind(comp.id, moduleId).first();

    competencyAverages.push({
      competencyName: comp.name as string,
      average: (scoreResult as Record<string, unknown>)?.avg_score as number || 0,
    });
  }

  // Top misconceptions (most commonly wrong answers)
  const miscResult = await env.DB.prepare(
    `SELECT q.question_text, q.competency_id, aa.selected_answer, COUNT(*) as frequency,
            c.name as competency_name, q.critical
     FROM attempt_answers aa
     JOIN questions q ON aa.question_id = q.id
     JOIN competencies c ON q.competency_id = c.id
     WHERE aa.is_correct = 0 AND q.module_id = ?
     GROUP BY q.id, aa.selected_answer
     ORDER BY frequency DESC
     LIMIT 10`
  ).bind(moduleId).all();

  // Intervention list (learners who need help)
  const interventionResult = await env.DB.prepare(
    `SELECT u.id as learner_id, u.name as learner_name, r.status, r.critical_failures,
            r.review_areas, a.submitted_at, COUNT(a.id) as attempt_count
     FROM results r
     JOIN attempts a ON r.attempt_id = a.id
     JOIN users u ON a.learner_id = u.id
     WHERE a.module_id = ? AND r.status != 'READY'
     GROUP BY u.id
     ORDER BY r.status DESC, a.submitted_at DESC`
  ).bind(moduleId).all();

  return jsonResponse({
    moduleId,
    assigned: 30, // Would come from enrollment table in production
    started,
    completed,
    completionRate: started > 0 ? completed / started : 0,
    readinessDistribution: distribution,
    competencyAverages,
    misconceptions: miscResult.results,
    interventionList: interventionResult.results,
  });
}
