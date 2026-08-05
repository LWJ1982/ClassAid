/**
 * POST /api/chat — Cloudflare Pages Function
 * RAG chatbot with citation tracking
 */

interface Env {
  DB: D1Database;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json() as { moduleId?: string; message?: string; conversationId?: string; learnerId?: string };
    const { moduleId, message, conversationId, learnerId } = body;

    if (!moduleId || !message) {
      return Response.json({ error: "moduleId and message are required" }, { status: 400 });
    }

    if (message.length > 2000) {
      return Response.json({ error: "Message exceeds maximum length" }, { status: 400 });
    }

    // 1. Embed the user question
    const embeddingResult = await env.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: message,
    }) as { data: number[][] };

    const queryVector = embeddingResult.data[0];

    // 2. Search Vectorize for relevant chunks
    const searchResults = await env.VECTORIZE.query(queryVector, {
      topK: 5,
      filter: { module_id: moduleId },
      returnMetadata: "all",
    });

    const chunks = searchResults.matches.filter((m) => m.score > 0.5);

    if (chunks.length === 0) {
      return Response.json({
        answer: "The approved material for this module does not provide enough information to answer this reliably. Review the listed module material or consult the responsible instructor.",
        category: "OUT_OF_SCOPE",
        citations: [],
        grounding: "INSUFFICIENT",
        recommendedAction: "Review the module material or consult the responsible instructor.",
        escalate: true,
        conversationId: conversationId || crypto.randomUUID(),
      });
    }

    // 3. Build context with citation metadata
    const contextParts = chunks.map((chunk, i) => {
      const meta = chunk.metadata || {};
      const source = meta.source_title || "Module Source";
      const section = meta.section || `Chunk ${i + 1}`;
      const page = meta.page ? `, Page ${meta.page}` : "";
      const content = meta.content || "";
      return `[Source: ${source}, ${section}${page}]\n"${content}"`;
    });

    // 4. Generate response
    const systemPrompt = `You are a learning coach. Answer ONLY using the provided source material. If evidence is insufficient, say so. Do NOT reveal assessment answers. Keep responses concise and pedagogical.

CONTEXT:
---
${contextParts.join("\n\n")}
---`;

    const llmResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }) as { response: string };

    // 5. Build citations from chunk metadata
    const citations = chunks.map((chunk) => {
      const meta = chunk.metadata || {};
      return {
        sourceTitle: meta.source_title || "Module Source Material",
        section: meta.section || "General",
        page: meta.page || null,
        version: meta.version || "",
        relevanceScore: chunk.score,
      };
    }).filter((c, i, arr) => arr.findIndex((x) => x.sourceTitle === c.sourceTitle && x.section === c.section) === i);

    // 6. Determine grounding
    const avgScore = chunks.reduce((s, c) => s + c.score, 0) / chunks.length;
    const grounding = avgScore > 0.75 ? "SUPPORTED" : avgScore > 0.6 ? "PARTIAL" : "INSUFFICIENT";

    // 7. Persist conversation
    const convId = conversationId || crypto.randomUUID();
    if (learnerId) {
      try {
        if (!conversationId) {
          await env.DB.prepare("INSERT OR IGNORE INTO conversations (id, learner_id, module_id) VALUES (?, ?, ?)").bind(convId, learnerId, moduleId).run();
        }
        await env.DB.prepare("INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)").bind(crypto.randomUUID(), convId, message).run();
        await env.DB.prepare("INSERT INTO messages (id, conversation_id, role, content, category, grounding, citations, escalate) VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), convId, llmResult.response, "CONCEPT", grounding, JSON.stringify(citations), grounding === "INSUFFICIENT" ? 1 : 0).run();
      } catch { /* non-critical */ }
    }

    return Response.json({
      answer: llmResult.response,
      category: "CONCEPT",
      citations,
      grounding,
      recommendedAction: `Review ${citations[0]?.section || "the module material"} for more detail.`,
      escalate: grounding === "INSUFFICIENT",
      conversationId: convId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
};
