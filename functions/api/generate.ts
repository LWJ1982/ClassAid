/**
 * POST /api/generate — Cloudflare Pages Function
 * AI question generation from module content
 */

interface Env {
  DB: D1Database;
  AI: Ai;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as { moduleId?: string; requestedBy?: string; questionKind?: string };
    const { moduleId, requestedBy, questionKind = "checkpoint" } = body;

    if (!moduleId || !requestedBy) {
      return Response.json({ error: "moduleId and requestedBy are required" }, { status: 400 });
    }

    const activities = await env.DB.prepare("SELECT * FROM activities WHERE module_id = ? ORDER BY sequence").bind(moduleId).all();
    const chunks = await env.DB.prepare("SELECT content, section FROM source_chunks WHERE module_id = ? ORDER BY chunk_index").bind(moduleId).all();

    const sourceContext = chunks.results.map((c: Record<string, unknown>) => `[${c.section}]\n${c.content}`).join("\n\n").substring(0, 4000);
    const generatedQuestions: { id: string; questionText: string; status: string }[] = [];

    for (const activity of activities.results as Record<string, unknown>[]) {
      const prompt = `Generate ONE multiple-choice comprehension question for this activity.

Activity: "${activity.title}"
Content: "${(activity.content as string).substring(0, 500)}"

Source material: ${sourceContext.substring(0, 1500)}

Respond ONLY with JSON: {"questionText":"...","options":["A","B","C","D"],"correctAnswer":"exact option text","explanation":"...","failureHint":"..."}`;

      try {
        const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages: [
            { role: "system", content: "Generate educational questions. Respond with valid JSON only." },
            { role: "user", content: prompt },
          ],
          max_tokens: 600,
          temperature: 0.4,
        }) as { response: string };

        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.questionText && parsed.options && parsed.correctAnswer) {
            const qId = crypto.randomUUID();
            await env.DB.prepare(
              `INSERT INTO questions (id, module_id, competency_id, question_text, question_type, options, correct_answer, explanation, critical, question_kind, activity_id, approval_status, failure_hint, min_read_seconds, generated_at)
               VALUES (?, ?, ?, ?, 'multiple-choice', ?, ?, ?, 0, ?, ?, 'auto_generated', ?, 25, datetime('now'))`
            ).bind(qId, moduleId, activity.competency_id, parsed.questionText, JSON.stringify(parsed.options), parsed.correctAnswer, parsed.explanation || "", questionKind, activity.id, parsed.failureHint || "").run();

            generatedQuestions.push({ id: qId, questionText: parsed.questionText, status: "auto_generated" });
          }
        }
      } catch { /* continue */ }
    }

    return Response.json({
      generated: generatedQuestions.length,
      questions: generatedQuestions,
      message: `${generatedQuestions.length} questions generated and pending instructor approval.`,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
};
