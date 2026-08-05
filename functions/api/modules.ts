/**
 * GET /api/modules - Cloudflare Pages Function
 * Lists modules with role-aware filtering
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { modulesQuerySchema } from '../lib/validation';
import { extractUser } from '../lib/auth';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status') || undefined;

    const parsed = modulesQuerySchema.safeParse({ status: statusParam });
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(env);

    // Attempt to extract user (unauthenticated access allowed in demo mode)
    const user = await extractUser(request, supabase);

    let query = supabase
      .from('modules')
      .select('*, domains(name)')
      .order('updated_at', { ascending: false });

    if (parsed.data.status) {
      query = query.eq('status', parsed.data.status);
    }

    // Role-based filtering:
    // - Admins: see all modules
    // - Instructors: see own modules + published modules
    // - Learners / unauthenticated (demo): see only published modules
    if (!user || user.role === 'learner') {
      // Learners and unauthenticated users only see published modules
      query = query.eq('status', 'published');
    } else if (user.role === 'instructor') {
      // Instructors see published modules and their own modules (any status)
      query = query.or(`status.eq.published,owner_id.eq.${user.id}`);
    }
    // Admins: no additional filter (see all)

    const { data, error } = await query;

    if (error) {
      console.error('Modules query error:', error.message);
      return Response.json(
        { error: 'Failed to fetch modules' },
        { status: 503 }
      );
    }

    // Transform to match existing response shape (domain_name field)
    const modules = (data || []).map((m) => ({
      ...m,
      domain_name: (m.domains as { name: string } | null)?.name || null,
      domains: undefined,
    }));

    return Response.json({ modules });
  } catch (error) {
    console.error('Modules error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};
