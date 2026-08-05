import { NextRequest } from "next/server";
import { getEnv, jsonResponse, errorResponse, generateId } from "@/lib/api-helpers";
import type { AiTextGenerationOutput, AiEmbeddingOutput, VectorizeMatch } from "@/lib/cloudflare";

/**
 * POST /api/chat
 * RAG chatbot with citation tracking
 * 
 * Flow:
 * 1. Validate input
 * 2. Embed user question via Workers AI
 * 3. Search Vectorize for relevant chunks
 * 4. Build prompt with retrieved context + citation metadata
 * 5. Generate response via Workers AI LLM
 * 6. Return structured response with citations from chunk metadata
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleId, message, conversationId, learnerId } = body;

    if (!moduleId || !message) {
      return errorResponse("moduleId and message are required");
    }

    if (message.length > 2000) {
      return errorResponse("Message exceeds maximum length (2000 characters)");
    }

    const env = getEnv();
    if (!env) {
      // Fallback mode: return mock response when Cloudflare bindings unavailable
      return jsonResponse(getFallbackResponse(message));
    }

    // 1. Embed the user question
    const embeddingResult = (await env.AI.run("@cf/baai/bge-base-en-v1.5", {
      text: message,
    })) as AiEmbeddingOutput;

    const queryVector = embeddingResult.data[0];

    // 2. Search Vectorize for relevant chunks (filtered by module)
    const searchResults = await env.VECTORIZE.query(queryVector, {
      topK: 5,
      filter: { module_id: moduleId },
      returnMetadata: true,
    });

    // 3. Build context from retrieved chunks with citation metadata
    const chunks = searchResults.matches.filter((m: VectorizeMatch) => m.score > 0.5);
    
    if (chunks.length === 0) {
      // No relevant content found
      return jsonResponse({
        answer: "The approved material for this module does not provide enough information to answer this reliably. Review the listed module material or consult the responsible instructor.",
        category: "OUT_OF_SCOPE",
        citations: [],
        grounding: "INSUFFICIENT",
        recommendedAction: "Review the module material or consult the responsible instructor.",
        escalate: true,
        conversationId: conversationId || generateId("conv"),
      });
    }

    // Build context string with source attribution
    const contextParts = chunks.map((chunk: VectorizeMatch, i: number) => {
      const meta = chunk.metadata || {};
      const source = meta.source_title || "Module Source";
      const section = meta.section || `Chunk ${i + 1}`;
      const page = meta.page ? `, Page ${meta.page}` : "";
      const content = meta.content || "";
      return `[Source: ${source}, ${section}${page}]\n"${content}"`;
    });

    const contextString = contextParts.join("\n\n");

    // 4. Build the LLM prompt
    const systemPrompt = `You are a learning coach for this module. Your role is to help learners understand concepts and procedures.

RULES:
- Answer ONLY using the provided source material below.
- For every claim, mentally note which source it comes from.
- If the evidence is insufficient to answer, say so clearly — never invent information.
- Do NOT reveal answers to assessment questions. If asked for a direct answer, provide a hint and direct to the source material.
- For safety/compliance questions where material is insufficient, advise stopping and consulting the instructor.
- Keep responses concise and pedagogical — explain concepts, don't just state facts.

CONTEXT (retrieved from approved module sources):
---
${contextString}
---`;

    // 5. Generate response
    const llmResult = (await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 500,
      temperature: 0.3,
    })) as AiTextGenerationOutput;

    const answer = llmResult.response || "I was unable to generate a response. Please try again.";

    // 6. Build citations from chunk metadata (guaranteed accurate — from retrieval, not LLM)
    const citations = chunks.map((chunk: VectorizeMatch) => {
      const meta = chunk.metadata || {};
      return {
        sourceTitle: (meta.source_title as string) || "Module Source Material",
        section: (meta.section as string) || "General",
        page: (meta.page as number) || null,
        version: (meta.version as string) || "",
        relevanceScore: chunk.score,
      };
    });

    // Deduplicate citations by source+section
    const uniqueCitations = citations.filter(
      (c, i, arr) => arr.findIndex((x) => x.sourceTitle === c.sourceTitle && x.section === c.section) === i
    );

    // 7. Determine grounding level
    const avgScore = chunks.reduce((s: number, c: VectorizeMatch) => s + c.score, 0) / chunks.length;
    const grounding = avgScore > 0.75 ? "SUPPORTED" : avgScore > 0.6 ? "PARTIAL" : "INSUFFICIENT";

    // 8. Classify category
    const category = classifyCategory(message);

    // 9. Determine escalation
    const escalate = grounding === "INSUFFICIENT" || isHighRiskQuery(message);

    // 10. Persist message if conversation exists
    const convId = conversationId || generateId("conv");
    if (learnerId) {
      try {
        // Create conversation if new
        if (!conversationId) {
          await env.DB.prepare(
            "INSERT OR IGNORE INTO conversations (id, learner_id, module_id) VALUES (?, ?, ?)"
          ).bind(convId, learnerId, moduleId).run();
        }
        // Store user message
        await env.DB.prepare(
          "INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)"
        ).bind(generateId("msg"), convId, message).run();
        // Store assistant response
        await env.DB.prepare(
          "INSERT INTO messages (id, conversation_id, role, content, category, grounding, citations, escalate) VALUES (?, ?, 'assistant', ?, ?, ?, ?, ?)"
        ).bind(generateId("msg"), convId, answer, category, grounding, JSON.stringify(uniqueCitations), escalate ? 1 : 0).run();
      } catch {
        // Non-critical: don't fail the response if persistence fails
      }
    }

    return jsonResponse({
      answer,
      category,
      citations: uniqueCitations,
      grounding,
      recommendedAction: getRecommendedAction(category, chunks),
      escalate,
      conversationId: convId,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return errorResponse("An error occurred processing your question. Please try again.", 500);
  }
}

function classifyCategory(message: string): string {
  const lower = message.toLowerCase();
  if (/safety|danger|risk|ppe|protect|hazard|shock/.test(lower)) return "COMPLIANCE";
  if (/how|step|procedure|connect|measure|process/.test(lower)) return "PROCEDURE";
  if (/why|what|explain|principle|theory|mean/.test(lower)) return "CONCEPT";
  if (/error|wrong|problem|fix|troubleshoot|ol|overload/.test(lower)) return "TROUBLESHOOTING";
  if (/apply|use|when|scenario|example/.test(lower)) return "APPLICATION";
  return "CONCEPT";
}

function isHighRiskQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return /answer.*quiz|correct.*answer|tell.*answer|give.*answer|what.*correct/.test(lower);
}

function getRecommendedAction(category: string, chunks: VectorizeMatch[]): string {
  if (chunks.length === 0) return "Review the module material or consult the responsible instructor.";
  const meta = chunks[0]?.metadata;
  const firstSection = (meta?.section as string) || "the relevant section";
  return `Review ${firstSection} for more detail.`;
}

// Fallback when running without Cloudflare bindings (local dev / static export)
function getFallbackResponse(message: string) {
  const lower = message.toLowerCase();
  
  const responses: { keywords: string[]; answer: string; category: string; citations: { sourceTitle: string; section: string; page: number; version: string; relevanceScore: number }[] }[] = [
    {
      keywords: ["voltage", "parallel"],
      answer: "Voltage is measured in parallel because the multimeter needs to measure the potential difference across a component without significantly affecting current flow. The high input impedance (>10MΩ) ensures negligible current is drawn by the meter.",
      category: "CONCEPT",
      citations: [{ sourceTitle: "DMM Manual v3.1", section: "Section 2.1 — Voltage Measurement Principles", page: 8, version: "3.1", relevanceScore: 0.92 }],
    },
    {
      keywords: ["current", "series", "terminal"],
      answer: "For current measurement, the red probe connects to the mA/A terminal and the circuit must be broken to insert the meter in series. This ensures all current flows through the meter for accurate measurement.",
      category: "PROCEDURE",
      citations: [{ sourceTitle: "DMM Manual v3.1", section: "Section 3.2 — Current Measurement Connections", page: 12, version: "3.1", relevanceScore: 0.89 }],
    },
    {
      keywords: ["safety", "danger", "ppe", "critical"],
      answer: "Critical safety rules include: never exceed max voltage rating, always verify mode before connecting to live circuits, never measure resistance in live circuits, use PPE for >50V, and inspect probes before use. Violation can cause shock, arc flash, or fire.",
      category: "COMPLIANCE",
      citations: [{ sourceTitle: "DMM Manual v3.1", section: "Section 5.1 — Critical Safety Procedures", page: 18, version: "3.1", relevanceScore: 0.95 }],
    },
    {
      keywords: ["resistance", "live", "energis"],
      answer: "Measuring resistance in a live circuit is dangerous because the DMM injects a small test voltage. External circuit voltage overwhelms this signal, causing incorrect readings, potential meter damage, and possible shock hazard. Always de-energise first.",
      category: "PROCEDURE",
      citations: [{ sourceTitle: "DMM Manual v3.1", section: "Section 5.3 — Resistance Measurement Safety", page: 20, version: "3.1", relevanceScore: 0.91 }],
    },
    {
      keywords: ["ol", "overload", "error", "display"],
      answer: '"OL" on the display indicates the resistance is beyond the meter\'s measurement capability at the current range. This typically means an open circuit, disconnected component, or need to select a higher range.',
      category: "TROUBLESHOOTING",
      citations: [{ sourceTitle: "DMM Manual v3.1", section: "Section 6.2 — Interpreting Display Indicators", page: 24, version: "3.1", relevanceScore: 0.87 }],
    },
  ];

  for (const r of responses) {
    if (r.keywords.some((kw) => lower.includes(kw))) {
      return {
        answer: r.answer,
        category: r.category,
        citations: r.citations,
        grounding: "SUPPORTED",
        recommendedAction: `Review ${r.citations[0]?.section || "the module material"} for more detail.`,
        escalate: false,
        conversationId: generateId("conv"),
      };
    }
  }

  return {
    answer: "The approved material for this module does not provide enough information to answer this reliably. I can help with questions about voltage/current/resistance measurement, connection procedures, safety rules, and common errors. For topics outside this scope, please consult the responsible instructor.",
    category: "OUT_OF_SCOPE",
    citations: [],
    grounding: "INSUFFICIENT",
    recommendedAction: "Review the module material or consult the responsible instructor.",
    escalate: true,
    conversationId: generateId("conv"),
  };
}
