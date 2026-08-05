/**
 * GET/PATCH /api/checkpoints - Cloudflare Pages Function
 * Checkpoint question management
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { checkpointPatchSchema } from '../lib/validation';
import { extractUser, requireRole } from '../lib/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const moduleId = url.searchParams.get('moduleId');

    if (!moduleId) {
      return Response.json({ error: 'moduleId required' }, { status: 400 });
    }

    const supabase = createSupabaseClient(env);

    // Require instructor/admin role to access checkpoint data (contains correct answers)
    const user = await extractUser(request, supabase);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized: authentication required' },
        { status: 401 }
      );
    }

    if (!requireRole(user, ['instructor', 'admin'])) {
      return Response.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('questions')
      .select('*, activities(title, sequence)')
      .eq('module_id', moduleId)
      .eq('question_kind', 'checkpoint')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Checkpoints query error:', error.message);
      return Response.json(
        { error: 'Database service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Transform to match expected response shape
    const checkpoints = (data || []).map((q) => ({
      ...q,
      activity_title: (q.activities as { title: string; sequence: number } | null)?.title || null,
      activity_sequence: (q.activities as { title: string; sequence: number } | null)?.sequence || null,
      activities: undefined,
    }));

    return Response.json({ checkpoints });
  } catch (error) {
    console.error('Checkpoints error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();

    const parsed = checkpointPatchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { questionId, action, approvedBy } = parsed.data;
    const supabase = createSupabaseClient(env);

    // Extract user identity from JWT or fall back to body field in demo mode
    const user = await extractUser(request, supabase, approvedBy);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized: invalid or expired token' },
        { status: 401 }
      );
    }

    // Only instructors and admins can approve/reject checkpoints
    if (!requireRole(user, ['instructor', 'admin'])) {
      return Response.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      );
    }

    const authenticatedUserId = user.id;

    if (action === 'approve') {
      const { error } = await supabase
        .from('questions')
        .update({
          approval_status: 'approved',
          approved_by: authenticatedUserId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) {
        console.error('Approve error:', error.message);
        return Response.json(
          { error: 'Database service temporarily unavailable' },
          { status: 503 }
        );
      }
    } else if (action === 'reject') {
      const { error } = await supabase
        .from('questions')
        .update({ approval_status: 'rejected' })
        .eq('id', questionId);

      if (error) {
        console.error('Reject error:', error.message);
        return Response.json(
          { error: 'Database service temporarily unavailable' },
          { status: 503 }
        );
      }
    }

    return Response.json({ success: true, questionId, action });
  } catch (error) {
    console.error('Checkpoint patch error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};
