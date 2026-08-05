import { NextRequest } from "next/server";
import { getEnv, jsonResponse, errorResponse, generateId } from "@/lib/api-helpers";

/**
 * GET /api/modules — List modules (filtered by role/ownership)
 * POST /api/modules — Create new module (instructor only)
 */
export async function GET(request: NextRequest) {
  const env = getEnv();
  if (!env) {
    // Fallback: return seeded module data
    return jsonResponse({
      modules: [{
        id: "module-1",
        title: "Digital Multimeter Fundamentals and Safety",
        domain: "Electrical & Electronics Engineering",
        status: "published",
        version: "1.2.0",
        estimatedMinutes: 25,
        overallThreshold: 0.8,
      }],
    });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const ownerId = searchParams.get("ownerId");

  let query = "SELECT m.*, d.name as domain_name FROM modules m JOIN domains d ON m.domain_id = d.id";
  const conditions: string[] = [];
  const binds: unknown[] = [];

  if (status) {
    conditions.push("m.status = ?");
    binds.push(status);
  }
  if (ownerId) {
    conditions.push("m.owner_id = ?");
    binds.push(ownerId);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }
  query += " ORDER BY m.updated_at DESC";

  const result = await env.DB.prepare(query).bind(...binds).all();
  return jsonResponse({ modules: result.results });
}

export async function POST(request: NextRequest) {
  const env = getEnv();
  if (!env) {
    return errorResponse("Module creation requires D1 database", 503);
  }

  const body = await request.json();
  const { title, description, domainId, ownerId, estimatedMinutes = 30, overallThreshold = 0.8 } = body;

  if (!title || !domainId || !ownerId) {
    return errorResponse("title, domainId, and ownerId are required");
  }

  const moduleId = generateId("mod");
  await env.DB.prepare(
    `INSERT INTO modules (id, domain_id, title, description, owner_id, estimated_minutes, overall_threshold)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(moduleId, domainId, title, description || "", ownerId, estimatedMinutes, overallThreshold).run();

  // Audit
  await env.DB.prepare(
    `INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, details)
     VALUES (?, ?, 'MODULE_CREATED', 'module', ?, ?)`
  ).bind(generateId("audit"), ownerId, moduleId, `Created module: ${title}`).run();

  return jsonResponse({ id: moduleId, title, status: "draft" }, 201);
}
