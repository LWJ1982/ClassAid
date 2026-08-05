/**
 * POST /api/assessments - Cloudflare Pages Function
 * Server-side deterministic scoring with critical-rule engine
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { assessmentRequestSchema } from '../lib/validation';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();

    const parsed = assessmentRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { moduleId, learnerId, answers } = parsed.data;
    const supabase = createSupabaseClient(env);

    // Load module
    const { data: moduleRecord, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .eq('status', 'published')
      .single();

    if (moduleError || !moduleRecord) {
      return Response.json({ error: 'Module not found' }, { status: 404 });
    }

    // Load approved assessment questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('module_id', moduleId)
      .eq('question_kind', 'assessment')
      .eq('approval_status', 'approved');

    if (questionsError) {
      console.error('Questions query error:', questionsError.message);
      return Response.json({ error: 'Failed to load questions' }, { status: 503 });
    }

    // Load competencies
    const { data: competencies, error: compError } = await supabase
      .from('competencies')
      .select('*')
      .eq('module_id', moduleId);

    if (compError) {
      console.error('Competencies query error:', compError.message);
      return Response.json({ error: 'Failed to load competencies' }, { status: 503 });
    }

    // Validate that submitted question IDs exist in the approved question set
    const validQuestionIds = new Set((questions || []).map((q) => q.id));
    for (const answer of answers) {
      if (!validQuestionIds.has(answer.questionId)) {
        return Response.json(
          { error: `Unknown or unapproved question ID: ${answer.questionId}` },
          { status: 400 }
        );
      }
    }

    // Score answers deterministically
    const attemptId = crypto.randomUUID();
    const attemptAnswers = answers.map((a) => {
      const q = (questions || []).find((qq) => qq.id === a.questionId);
      const isCorrect = q ? a.selectedAnswer === q.correct_answer : false;
      const isCriticalFailure = q ? q.critical && !isCorrect : false;
      return {
        id: crypto.randomUUID(),
        questionId: a.questionId,
        selected: a.selectedAnswer,
        isCorrect,
        isCriticalFailure,
      };
    });

    // Competency scores
    const competencyScores = (competencies || []).map((comp) => {
      const compQs = (questions || []).filter((q) => q.competency_id === comp.id);
      const compAs = attemptAnswers.filter((a) =>
        compQs.some((q) => q.id === a.questionId)
      );
      const score =
        compQs.length > 0
          ? compAs.filter((a) => a.isCorrect).length / compQs.length
          : 0;
      return {
        competencyId: comp.id,
        competencyName: comp.name,
        score,
        threshold: comp.min_threshold,
        passed: score >= comp.min_threshold,
        mandatory: comp.mandatory,
        critical: comp.critical,
      };
    });

    // Overall weighted score
    const totalWeight = (competencies || []).reduce((s, c) => s + c.weight, 0);
    const overallScore =
      totalWeight > 0
        ? (competencies || []).reduce((s, c) => {
            const cs = competencyScores.find((x) => x.competencyId === c.id);
            return s + (cs?.score ?? 0) * c.weight;
          }, 0) / totalWeight
        : 0;

    // Critical failures
    const criticalFailures = attemptAnswers
      .filter((a) => a.isCriticalFailure)
      .map((a) => {
        const q = (questions || []).find((qq) => qq.id === a.questionId);
        const c = (competencies || []).find((cc) => cc.id === q?.competency_id);
        return c?.name || 'Critical failure';
      });

    // Determine readiness status (deterministic, AI cannot influence)
    const threshold = moduleRecord.overall_threshold;
    let status: 'READY' | 'REVIEW_REQUIRED' | 'FURTHER_PREPARATION' | 'ESCALATE';
    if (criticalFailures.length > 0) {
      status = 'REVIEW_REQUIRED';
    } else if (competencyScores.some((cs) => cs.mandatory && !cs.passed)) {
      status = overallScore < threshold * 0.6 ? 'FURTHER_PREPARATION' : 'REVIEW_REQUIRED';
    } else if (overallScore >= threshold) {
      status = 'READY';
    } else {
      status = overallScore >= threshold * 0.75 ? 'REVIEW_REQUIRED' : 'FURTHER_PREPARATION';
    }

    // Persist attempt
    const { error: attemptError } = await supabase.from('attempts').insert({
      id: attemptId,
      learner_id: learnerId,
      module_id: moduleId,
      module_version: moduleRecord.version,
      submitted_at: new Date().toISOString(),
      status: 'scored',
      overall_score: overallScore,
    });

    if (attemptError) {
      console.error('Attempt insert error:', attemptError.message);
      return Response.json({ error: 'Failed to save attempt' }, { status: 503 });
    }

    // Persist attempt answers
    const answerRecords = attemptAnswers.map((ans) => ({
      id: ans.id,
      attempt_id: attemptId,
      question_id: ans.questionId,
      selected_answer: ans.selected,
      is_correct: ans.isCorrect,
      is_critical_failure: ans.isCriticalFailure,
    }));

    const { error: answersError } = await supabase
      .from('attempt_answers')
      .insert(answerRecords);

    if (answersError) {
      console.error('Answers insert error:', answersError.message);
    }

    // Persist result
    const resultId = crypto.randomUUID();
    const { error: resultError } = await supabase.from('results').insert({
      id: resultId,
      attempt_id: attemptId,
      overall_score: overallScore,
      status,
      competency_scores: competencyScores,
      critical_failures: criticalFailures,
      strengths: competencyScores.filter((c) => c.passed).map((c) => c.competencyName),
      review_areas: competencyScores.filter((c) => !c.passed).map((c) => c.competencyName),
      remediation: [],
    });

    if (resultError) {
      console.error('Result insert error:', resultError.message);
    }

    return Response.json({
      attemptId,
      resultId,
      overallScore,
      status,
      competencyScores,
      criticalFailures,
    });
  } catch (error) {
    console.error('Assessment error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};
