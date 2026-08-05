/**
 * GET /api/modules - Cloudflare Pages Function
 * Lists modules with optional status filter
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { modulesQuerySchema } from '../lib/validation';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    const url = new URL(context.request.url);
    const statusParam = url.searchParams.get('status') || undefined;

    const parsed = modulesQuerySchema.safeParse({ status: statusParam });
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(env);

    let query = supabase
      .from('modules')
      .select('*, domains(name)')
      .order('updated_at', { ascending: false });

    if (parsed.data.status) {
      query = query.eq('status', parsed.data.status);
    }

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
