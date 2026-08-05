/**
 * POST /api/assessments — Cloudflare Pages Function
 * Server-side scoring with critical-rule engine
 */

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as { moduleId?: string; learnerId?: string; answers?: { questionId: string; selectedAnswer: string }[] };
    const { moduleId, learnerId, answers } = body;

    if (!moduleId || !learnerId || !answers || !Array.isArray(answers)) {
      return Response.json({ error: "moduleId, learnerId, and answers are required" }, { status: 400 });
    }

    // Load module
    const moduleRecord = await env.DB.prepare("SELECT * FROM modules WHERE id = ? AND status = 'published'").bind(moduleId).first();
    if (!moduleRecord) return Response.json({ error: "Module not found" }, { status: 404 });

    // Load questions and competencies
    const questions = (await env.DB.prepare("SELECT * FROM questions WHERE module_id = ? AND question_kind = 'assessment' AND approval_status = 'approved'").bind(moduleId).all()).results as Record<string, unknown>[];
    const competencies = (await env.DB.prepare("SELECT * FROM competencies WHERE module_id = ?").bind(moduleId).all()).results as Record<string, unknown>[];

    // Score answers
    const attemptId = crypto.randomUUID();
    const attemptAnswers = answers.map(a => {
      const q = questions.find(qq => qq.id === a.questionId);
      const isCorrect = q ? a.selectedAnswer === q.correct_answer : false;
      const isCriticalFailure = q ? (q.critical as number) === 1 && !isCorrect : false;
      return { id: crypto.randomUUID(), questionId: a.questionId, selected: a.selectedAnswer, isCorrect, isCriticalFailure };
    });

    // Competency scores
    const competencyScores = competencies.map(comp => {
      const compQs = questions.filter(q => q.competency_id === comp.id);
      const compAs = attemptAnswers.filter(a => compQs.some(q => q.id === a.questionId));
      const score = compQs.length > 0 ? compAs.filter(a => a.isCorrect).length / compQs.length : 0;
      return { competencyId: comp.id as string, competencyName: comp.name as string, score, threshold: comp.min_threshold as number, passed: score >= (comp.min_threshold as number), mandatory: (comp.mandatory as number) === 1, critical: (comp.critical as number) === 1 };
    });

    // Overall score
    const totalWeight = competencies.reduce((s, c) => s + (c.weight as number), 0);
    const overallScore = totalWeight > 0 ? competencies.reduce((s, c) => { const cs = competencyScores.find(x => x.competencyId === c.id); return s + (cs?.score ?? 0) * (c.weight as number); }, 0) / totalWeight : 0;

    // Critical failures
    const criticalFailures = attemptAnswers.filter(a => a.isCriticalFailure).map(a => { const q = questions.find(qq => qq.id === a.questionId); const c = competencies.find(cc => cc.id === q?.competency_id); return (c?.name as string) || "Critical failure"; });

    // Status
    const threshold = moduleRecord.overall_threshold as number;
    let status: string;
    if (criticalFailures.length > 0) status = "REVIEW_REQUIRED";
    else if (competencyScores.some(cs => cs.mandatory && !cs.passed)) status = overallScore < threshold * 0.6 ? "FURTHER_PREPARATION" : "REVIEW_REQUIRED";
    else if (overallScore >= threshold) status = "READY";
    else status = overallScore >= threshold * 0.75 ? "REVIEW_REQUIRED" : "FURTHER_PREPARATION";

    // Persist
    await env.DB.prepare("INSERT INTO attempts (id, learner_id, module_id, module_version, submitted_at, status, overall_score) VALUES (?, ?, ?, ?, datetime('now'), 'scored', ?)").bind(attemptId, learnerId, moduleId, moduleRecord.version as string, overallScore).run();

    for (const ans of attemptAnswers) {
      await env.DB.prepare("INSERT INTO attempt_answers (id, attempt_id, question_id, selected_answer, is_correct, is_critical_failure) VALUES (?, ?, ?, ?, ?, ?)").bind(ans.id, attemptId, ans.questionId, ans.selected, ans.isCorrect ? 1 : 0, ans.isCriticalFailure ? 1 : 0).run();
    }

    const resultId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO results (id, attempt_id, overall_score, status, competency_scores, critical_failures, strengths, review_areas, remediation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(resultId, attemptId, overallScore, status, JSON.stringify(competencyScores), JSON.stringify(criticalFailures), JSON.stringify(competencyScores.filter(c => c.passed).map(c => c.competencyName)), JSON.stringify(competencyScores.filter(c => !c.passed).map(c => c.competencyName)), JSON.stringify([])).run();

    return Response.json({ attemptId, resultId, overallScore, status, competencyScores, criticalFailures });
  } catch (error) {
    console.error("Assessment error:", error);
    return Response.json({ error: "Assessment failed" }, { status: 500 });
  }
};
