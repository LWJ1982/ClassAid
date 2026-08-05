/**
 * POST /api/upload — Cloudflare Pages Function
 * File upload → R2 → chunk → embed → Vectorize
 */

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const moduleId = formData.get("moduleId") as string | null;
    const uploadedBy = formData.get("uploadedBy") as string | null;
    const sourceTitle = formData.get("sourceTitle") as string | null;

    if (!file || !moduleId || !uploadedBy) {
      return Response.json({ error: "file, moduleId, and uploadedBy are required" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const sourceId = crypto.randomUUID();
    const r2Key = `modules/${moduleId}/sources/${sourceId}/${file.name}`;

    // Store in R2
    const fileBuffer = await file.arrayBuffer();
    await env.BUCKET.put(r2Key, fileBuffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: { moduleId, uploadedBy, originalFilename: file.name },
    });

    // Extract text
    const textContent = await file.text();
    if (textContent.trim().length < 50) {
      return Response.json({ error: "File contains insufficient text content" }, { status: 400 });
    }

    // Record source
    await env.DB.prepare(
      "INSERT INTO sources (id, module_id, filename, r2_key, content_type, file_size, status, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, 'processing', ?)"
    ).bind(sourceId, moduleId, file.name, r2Key, file.type, file.size, uploadedBy).run();

    // Chunk text
    const paragraphs = textContent.split(/\n\n+/).filter(p => p.trim().length > 0);
    const chunks: { content: string; index: number }[] = [];
    let currentChunk = "";
    let chunkIndex = 0;

    for (const para of paragraphs) {
      if ((currentChunk + "\n\n" + para).length > 800 && currentChunk.length > 0) {
        chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
        currentChunk = para;
      } else {
        currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
      }
    }
    if (currentChunk.trim()) chunks.push({ content: currentChunk.trim(), index: chunkIndex });

    // Embed and store
    const title = sourceTitle || file.name.replace(/\.[^.]+$/, "");
    const vectors: VectorizeVector[] = [];

    for (const chunk of chunks) {
      const chunkId = crypto.randomUUID();
      const embResult = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: chunk.content }) as { data: number[][] };

      vectors.push({
        id: chunkId,
        values: embResult.data[0],
        metadata: {
          source_id: sourceId,
          source_title: title,
          filename: file.name,
          section: `Section ${chunk.index + 1}`,
          chunk_index: chunk.index,
          module_id: moduleId,
          content: chunk.content.substring(0, 500),
          version: "1.0",
        },
      });

      await env.DB.prepare(
        "INSERT INTO source_chunks (id, source_id, module_id, chunk_index, content, section, vector_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(chunkId, sourceId, moduleId, chunk.index, chunk.content, `Section ${chunk.index + 1}`, chunkId).run();
    }

    // Batch insert vectors
    if (vectors.length > 0) {
      for (let i = 0; i < vectors.length; i += 100) {
        await env.VECTORIZE.upsert(vectors.slice(i, i + 100));
      }
    }

    // Update source status
    await env.DB.prepare("UPDATE sources SET status = 'indexed', chunk_count = ? WHERE id = ?").bind(chunks.length, sourceId).run();

    return Response.json({
      sourceId,
      filename: file.name,
      status: "indexed",
      chunkCount: chunks.length,
      message: `File processed successfully. ${chunks.length} chunks indexed for retrieval.`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json({ error: "Failed to process file" }, { status: 500 });
  }
};
