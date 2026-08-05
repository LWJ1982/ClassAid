/**
 * Workers AI embedding helper
 * Uses BGE-base-en-v1.5 for 768-dimension embeddings
 */

interface EmbeddingResult {
  data: number[][];
}

/**
 * Generates a 768-dimension embedding vector for the given text
 * using Cloudflare Workers AI BGE-base-en-v1.5 model.
 */
export async function generateEmbedding(ai: Ai, text: string): Promise<number[]> {
  const result = await ai.run('@cf/baai/bge-base-en-v1.5', {
    text: [text],
  }) as EmbeddingResult;

  if (!result.data || !result.data[0]) {
    throw new Error('Failed to generate embedding: empty result');
  }

  return result.data[0];
}
