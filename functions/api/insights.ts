/**
 * GET /api/insights - Cloudflare Pages Function
 * Instructor analytics and insights
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { insightsQuerySchema } from '../lib/validation';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const url = new URL(context.request.url);
    const moduleId = url.searchParams.get('moduleId');

    const parsed = insightsQuerySchema.safeParse({ moduleId });
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(env);

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
      assigned: 30,
      started: 27,
      completed,
      completionRate: completed > 0 ? completed / 30 : 0,
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
