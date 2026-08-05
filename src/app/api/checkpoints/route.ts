export const runtime = "edge";
import { NextRequest } from "next/server";
import { getEnv, jsonResponse, errorResponse } from "@/lib/api-helpers";

/**
 * GET /api/checkpoints?moduleId=xxx — List checkpoint questions with approval status
 * PATCH /api/checkpoints — Approve, reject, or edit a checkpoint question
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get("moduleId");
  const status = searchParams.get("status"); // filter by approval_status

  if (!moduleId) {
    return errorResponse("moduleId is required");
  }

  const env = getEnv();
  if (!env) {
    return jsonResponse({ checkpoints: [] });
  }

  let query = `SELECT q.*, a.title as activity_title, a.sequence as activity_sequence
               FROM questions q
               LEFT JOIN activities a ON q.activity_id = a.id
               WHERE q.module_id = ? AND q.question_kind = 'checkpoint'`;
  const binds: unknown[] = [moduleId];

  if (status) {
    query += " AND q.approval_status = ?";
    binds.push(status);
  }

  query += " ORDER BY a.sequence, q.created_at";

  const result = await env.DB.prepare(query).bind(...binds).all();
  return jsonResponse({ checkpoints: result.results });
}

export async function PATCH(request: NextRequest) {
  const env = getEnv();
  if (!env) {
    return errorResponse("Checkpoint management requires D1 database", 503);
  }

  const body = await request.json();
  const { questionId, action, updates, approvedBy } = body;

  if (!questionId || !action) {
    return errorResponse("questionId and action are required");
  }

  switch (action) {
    case "approve":
      await env.DB.prepare(
        `UPDATE questions SET approval_status = 'approved', approved_by = ?, approved_at = datetime('now') WHERE id = ?`
      ).bind(approvedBy || "unknown", questionId).run();
      break;

    case "reject":
      await env.DB.prepare(
        `UPDATE questions SET approval_status = 'rejected' WHERE id = ?`
      ).bind(questionId).run();
      break;

    case "edit":
      if (!updates) return errorResponse("updates object required for edit action");
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.questionText) { fields.push("question_text = ?"); values.push(updates.questionText); }
      if (updates.options) { fields.push("options = ?"); values.push(JSON.stringify(updates.options)); }
      if (updates.correctAnswer) { fields.push("correct_answer = ?"); values.push(updates.correctAnswer); }
      if (updates.explanation) { fields.push("explanation = ?"); values.push(updates.explanation); }
      if (updates.failureHint) { fields.push("failure_hint = ?"); values.push(updates.failureHint); }
      if (updates.minReadSeconds) { fields.push("min_read_seconds = ?"); values.push(updates.minReadSeconds); }

      if (fields.length > 0) {
        fields.push("approval_status = 'edited'");
        values.push(questionId);
        await env.DB.prepare(
          `UPDATE questions SET ${fields.join(", ")} WHERE id = ?`
        ).bind(...values).run();
      }
      break;

    default:
      return errorResponse("Invalid action. Use: approve, reject, edit");
  }

  return jsonResponse({ success: true, questionId, action });
}
