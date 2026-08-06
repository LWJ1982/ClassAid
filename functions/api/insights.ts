/**
 * GET /api/insights - Cloudflare Pages Function
 * Instructor analytics and insights
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { insightsQuerySchema } from '../lib/validation';
import { extractUser, requireRole } from '../lib/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const moduleId = url.searchParams.get('moduleId');

    const parsed = insightsQuerySchema.safeParse({ moduleId });
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(env);

    // Require authentication for insights
    const user = await extractUser(request, supabase);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized: authentication required' },
        { status: 401 }
      );
    }

    // Only instructors and admins can view insights
    if (!requireRole(user, ['instructor', 'admin'])) {
      return Response.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      );
    }

    // Count distinct learners assigned (enrolled) for this module
    // A learner is considered "assigned" if they have any attempt (regardless of status)
    // or if they are linked to the module in some enrollment record.
    // Since we don't have a dedicated enrollment table, we count distinct learners
    // who have at least one attempt record (any status) as "assigned",
    // which represents learners who have been given access to the module.
    const { data: assignedData, error: assignedError } = await supabase
      .from('attempts')
      .select('learner_id')
      .eq('module_id', parsed.data.moduleId);

    if (assignedError) {
      console.error('Assigned count error:', assignedError.message);
      return Response.json(
        { error: 'Database service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Count distinct learners who have started (have at least one attempt)
    const distinctLearnerIds = new Set(
      (assignedData || []).map((row) => row.learner_id)
    );
    const assigned = distinctLearnerIds.size;
    const started = distinctLearnerIds.size;

    // Count completed (scored) attempts
    const { count: completedCount, error: countError } = await supabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('module_id', parsed.data.moduleId)
      .eq('status', 'scored');

    if (countError) {
      console.error('Attempts count error:', countError.message);
      return Response.json(
        { error: 'Database service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Get readiness distribution from results
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('status, attempts!inner(module_id)')
      .eq('attempts.module_id', parsed.data.moduleId);

    if (resultsError) {
      console.error('Results query error:', resultsError.message);
      return Response.json(
        { error: 'Database service temporarily unavailable' },
        { status: 503 }
      );
    }

    const dist: Record<string, number> = {
      READY: 0,
      REVIEW_REQUIRED: 0,
      FURTHER_PREPARATION: 0,
      ESCALATE: 0,
    };

    for (const row of results || []) {
      if (row.status in dist) {
        dist[row.status]++;
      }
    }

    const completed = completedCount || 0;

    return Response.json({
      moduleId: parsed.data.moduleId,
      assigned,
      started,
      completed,
      completionRate: assigned > 0 ? completed / assigned : 0,
      readinessDistribution: dist,
    });
  } catch (error) {
    console.error('Insights error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};
