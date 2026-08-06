/**
 * POST /api/assessments - Cloudflare Pages Function
 * Server-side deterministic scoring with critical-rule engine
 * Uses shared readiness engine for single source of truth
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { assessmentRequestSchema } from '../lib/validation';
import { extractUser } from '../lib/auth';
import { calculateReadiness } from '../../src/lib/engine/readiness-engine';
import type {
  AssessmentQuestion,
  AttemptAnswer,
  Competency,
} from '../../src/lib/domain/types';

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

    // Extract user identity from JWT or fall back to body field in demo mode
    const user = await extractUser(request, supabase, learnerId);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized: invalid or expired token' },
        { status: 401 }
      );
    }

    const authenticatedLearnerId = user.id;

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

    // Idempotency check: reject if a scored attempt already exists for this learner+module+version
    const { data: existingAttempt, error: existingError } = await supabase
      .from('attempts')
      .select('id')
      .eq('learner_id', authenticatedLearnerId)
      .eq('module_id', moduleId)
      .eq('module_version', moduleRecord.version)
      .eq('status', 'scored')
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error('Idempotency check error:', existingError.message);
      return Response.json(
        { error: 'Database service temporarily unavailable' },
        { status: 503 }
      );
    }

    if (existingAttempt) {
      return Response.json(
        { error: 'Assessment already submitted for this module version' },
        { status: 409 }
      );
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

    // Validate submission completeness: all approved questions must have an answer
    const approvedQuestions = questions || [];
    if (answers.length !== approvedQuestions.length) {
      return Response.json(
        { error: `Incomplete submission: expected ${approvedQuestions.length} answers, received ${answers.length}` },
        { status: 400 }
      );
    }

    // Validate that submitted question IDs exist in the approved question set
    const validQuestionIds = new Set(approvedQuestions.map((q) => q.id));
    for (const answer of answers) {
      if (!validQuestionIds.has(answer.questionId)) {
        return Response.json(
          { error: `Unknown or unapproved question ID: ${answer.questionId}` },
          { status: 400 }
        );
      }
    }

    // Map database records to domain types for the shared engine
    const engineQuestions: AssessmentQuestion[] = approvedQuestions.map((q) => ({
      id: q.id,
      moduleVersionId: moduleId,
      competencyId: q.competency_id || '',
      questionText: q.question_text,
      questionType: (q.question_type || 'multiple-choice') as 'multiple-choice' | 'true-false',
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      explanation: q.explanation || '',
      critical: q.critical,
      sourceReference: '',
    }));

    const engineCompetencies: Competency[] = (competencies || []).map((c) => ({
      id: c.id,
      moduleVersionId: moduleId,
      name: c.name,
      description: '',
      weight: c.weight,
      minimumThreshold: c.min_threshold,
      mandatory: c.mandatory,
      critical: c.critical,
    }));

    // Score answers deterministically using the question data
    const attemptId = crypto.randomUUID();
    const engineAnswers: AttemptAnswer[] = answers.map((a) => {
      const q = engineQuestions.find((qq) => qq.id === a.questionId);
      const isCorrect = q ? a.selectedAnswer === q.correctAnswer : false;
      const isCriticalFailure = q ? q.critical && !isCorrect : false;
      return {
        id: crypto.randomUUID(),
        attemptId,
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect,
        isCriticalFailure,
      };
    });

    // Use the shared readiness engine for scoring
    const result = calculateReadiness({
      attemptId,
      questions: engineQuestions,
      answers: engineAnswers,
      competencies: engineCompetencies,
      overallThreshold: moduleRecord.overall_threshold,
    });

    // Persist attempt
    const { error: attemptError } = await supabase.from('attempts').insert({
      id: attemptId,
      learner_id: authenticatedLearnerId,
      module_id: moduleId,
      module_version: moduleRecord.version,
      submitted_at: new Date().toISOString(),
      status: 'scored',
      overall_score: result.overallScore,
    });

    if (attemptError) {
      // Catch unique violation (PostgreSQL 23505) as a safety net for concurrent duplicates
      if (attemptError.code === '23505') {
        return Response.json(
          { error: 'Assessment already submitted for this module version' },
          { status: 409 }
        );
      }
      console.error('Attempt insert error:', attemptError.message);
      return Response.json({ error: 'Failed to save attempt' }, { status: 503 });
    }

    // Persist attempt answers
    const answerRecords = engineAnswers.map((ans) => ({
      id: ans.id,
      attempt_id: attemptId,
      question_id: ans.questionId,
      selected_answer: ans.selectedAnswer,
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
      overall_score: result.overallScore,
      status: result.status,
      competency_scores: JSON.parse(JSON.stringify(result.competencyScores)),
      critical_failures: result.criticalFailures,
      strengths: result.strengths,
      review_areas: result.reviewAreas,
      remediation: JSON.parse(JSON.stringify(result.remediationActions)),
    });

    if (resultError) {
      console.error('Result insert error:', resultError.message);
    }

    return Response.json({
      attemptId,
      resultId,
      overallScore: result.overallScore,
      status: result.status,
      competencyScores: result.competencyScores,
      criticalFailures: result.criticalFailures,
    });
  } catch (error) {
    console.error('Assessment error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};
