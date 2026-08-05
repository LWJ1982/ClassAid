/**
 * GET/PATCH /api/checkpoints — Cloudflare Pages Function
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const url = new URL(context.request.url);
  const moduleId = url.searchParams.get("moduleId");
  if (!moduleId) return Response.json({ error: "moduleId required" }, { status: 400 });

  const result = await env.DB.prepare(
    "SELECT q.*, a.title as activity_title, a.sequence as activity_sequence FROM questions q LEFT JOIN activities a ON q.activity_id = a.id WHERE q.module_id = ? AND q.question_kind = 'checkpoint' ORDER BY a.sequence"
  ).bind(moduleId).all();

  return Response.json({ checkpoints: result.results });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const body = await request.json() as { questionId?: string; action?: string; updates?: Record<string, unknown>; approvedBy?: string };
  const { questionId, action, approvedBy } = body;

  if (!questionId || !action) return Response.json({ error: "questionId and action required" }, { status: 400 });

  if (action === "approve") {
    await env.DB.prepare("UPDATE questions SET approval_status = 'approved', approved_by = ?, approved_at = datetime('now') WHERE id = ?").bind(approvedBy || "unknown", questionId).run();
  } else if (action === "reject") {
    await env.DB.prepare("UPDATE questions SET approval_status = 'rejected' WHERE id = ?").bind(questionId).run();
  }

  return Response.json({ success: true, questionId, action });
};
