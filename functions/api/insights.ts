/**
 * GET /api/insights — Cloudflare Pages Function
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const url = new URL(context.request.url);
  const moduleId = url.searchParams.get("moduleId");

  if (!moduleId) return Response.json({ error: "moduleId required" }, { status: 400 });

  const completed = (await env.DB.prepare("SELECT COUNT(*) as c FROM attempts WHERE module_id = ? AND status = 'scored'").bind(moduleId).first()) as { c: number } | null;

  const distribution = (await env.DB.prepare("SELECT r.status, COUNT(*) as count FROM results r JOIN attempts a ON r.attempt_id = a.id WHERE a.module_id = ? GROUP BY r.status").bind(moduleId).all()).results;

  const dist: Record<string, number> = { READY: 0, REVIEW_REQUIRED: 0, FURTHER_PREPARATION: 0, ESCALATE: 0 };
  for (const row of distribution as Record<string, unknown>[]) {
    dist[row.status as string] = row.count as number;
  }

  return Response.json({
    moduleId,
    assigned: 30,
    started: 27,
    completed: completed?.c || 0,
    completionRate: completed?.c ? (completed.c / 30) : 0,
    readinessDistribution: dist,
  });
};
