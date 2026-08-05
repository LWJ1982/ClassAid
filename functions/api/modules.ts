/**
 * GET /api/modules — Cloudflare Pages Function
 */

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const url = new URL(context.request.url);
  const status = url.searchParams.get("status");

  let query = "SELECT m.*, d.name as domain_name FROM modules m JOIN domains d ON m.domain_id = d.id";
  if (status) query += ` WHERE m.status = '${status}'`;
  query += " ORDER BY m.updated_at DESC";

  const result = await env.DB.prepare(query).all();
  return Response.json({ modules: result.results });
};
