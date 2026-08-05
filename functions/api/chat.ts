/**
 * POST /api/chat - Cloudflare Pages Function
 * RAG chatbot with citation tracking
 * Uses Workers AI for embeddings, pgvector for search, Groq for generation
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { generateEmbedding } from '../lib/embeddings';
import { callGroq, GroqError } from '../lib/groq';
import { chatRequestSchema } from '../lib/validation';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body = await request.json();

    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { moduleId, message, conversationId, learnerId } = parsed.data;
    const supabase = createSupabaseClient(env);

    // 1. Embed the user question via Workers AI
    let queryVector: number[];
    try {
      queryVector = await generateEmbedding(env.AI, message);
    } catch (error) {
      console.error('Embedding error:', error);
      return Response.json(
        { error: 'Embedding service temporarily unavailable' },
        { status: 503 }
      );
    }

    // 2. Search pgvector for relevant chunks
    const vectorString = `[${queryVector.join(',')}]`;
    const { data: chunks, error: searchError } = await supabase.rpc(
      'match_source_chunks',
      {
        query_embedding: vectorString,
        match_threshold: 0.5,
        match_count: 5,
        filter_module_id: moduleId,
      }
    );

    if (searchError) {
      console.error('Vector search error:', searchError.message);
      return Response.json(
        { error: 'Search service temporarily unavailable' },
        { status: 503 }
      );
    }

    // 3. Handle insufficient grounding
    if (!chunks || chunks.length === 0) {
      const convId = conversationId || crypto.randomUUID();
      return Response.json({
        answer:
          'The approved material for this module does not provide enough information to answer this reliably. Review the listed module material or consult the responsible instructor.',
        category: 'OUT_OF_SCOPE',
        citations: [],
        grounding: 'INSUFFICIENT',
        recommendedAction: 'Review the module material or consult the responsible instructor.',
        escalate: true,
        conversationId: convId,
      });
    }

    // 4. Load source metadata for citations
    const sourceIds = [...new Set(chunks.map((c) => c.source_id))];
    const { data: sources } = await supabase
      .from('sources')
      .select('id, filename')
      .in('id', sourceIds);

    const sourceMap = new Map(
      (sources || []).map((s) => [s.id, s.filename])
    );

    // 5. Build context with citation metadata
    const contextParts = chunks.map((chunk, i) => {
      const sourceTitle = sourceMap.get(chunk.source_id) || 'Module Source';
      const section = chunk.section || `Section ${i + 1}`;
      return `[Source: ${sourceTitle}, ${section}]\n"${chunk.content}"`;
    });

    // 6. Generate response via Groq
    const systemPrompt = `You are a learning coach. Answer ONLY using the provided source material. If evidence is insufficient, say so. Do NOT reveal assessment answers. Keep responses concise and pedagogical.

CONTEXT:
---
${contextParts.join('\n\n')}
---`;

    let llmResponse: string;
    try {
      llmResponse = await callGroq(env.GROQ_API_KEY, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.3,
        maxTokens: 500,
      });
    } catch (error) {
      if (error instanceof GroqError) {
        console.error('Groq error:', error.message);
        return Response.json(
          { error: 'AI service temporarily unavailable' },
          { status: 503 }
        );
      }
      throw error;
    }

    // 7. Build citations from chunk metadata (NOT from LLM output)
    const citations = chunks
      .map((chunk) => ({
        sourceTitle: sourceMap.get(chunk.source_id) || 'Module Source Material',
        section: chunk.section || 'General',
        page: null as number | null,
        version: '',
        relevanceScore: chunk.similarity,
      }))
      .filter(
        (c, i, arr) =>
          arr.findIndex(
            (x) => x.sourceTitle === c.sourceTitle && x.section === c.section
          ) === i
      );

    // 8. Determine grounding level
    const avgScore =
      chunks.reduce((s, c) => s + c.similarity, 0) / chunks.length;
    const grounding =
      avgScore > 0.75
        ? 'SUPPORTED'
        : avgScore > 0.6
          ? 'PARTIAL'
          : 'INSUFFICIENT';

    // 9. Persist conversation
    const convId = conversationId || crypto.randomUUID();
    if (learnerId) {
      try {
        if (!conversationId) {
          await supabase.from('conversations').insert({
            id: convId,
            learner_id: learnerId,
            module_id: moduleId,
          });
        }
        await supabase.from('messages').insert({
          id: crypto.randomUUID(),
          conversation_id: convId,
          role: 'user',
          content: message,
        });
        await supabase.from('messages').insert({
          id: crypto.randomUUID(),
          conversation_id: convId,
          role: 'assistant',
          content: llmResponse,
          category: 'CONCEPT',
          grounding,
          citations,
          escalate: grounding === 'INSUFFICIENT',
        });
      } catch {
        /* non-critical persistence failure */
      }
    }

    return Response.json({
      answer: llmResponse,
      category: 'CONCEPT',
      citations,
      grounding,
      recommendedAction: `Review ${citations[0]?.section || 'the module material'} for more detail.`,
      escalate: grounding === 'INSUFFICIENT',
      conversationId: convId,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};
