/**
 * POST /api/upload - Cloudflare Pages Function
 * File upload -> Supabase Storage -> chunk -> embed via Workers AI -> store in pgvector
 */

import type { Env } from '../lib/env';
import { createSupabaseClient } from '../lib/supabase';
import { generateEmbedding } from '../lib/embeddings';
import { uploadFieldsSchema } from '../lib/validation';
import { extractUser, requireRole } from '../lib/auth';

/** Allowed text-based content types for upload */
const ALLOWED_CONTENT_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const moduleId = formData.get('moduleId') as string | null;
    const uploadedBy = formData.get('uploadedBy') as string | null;
    const sourceTitle = formData.get('sourceTitle') as string | null;

    // Validate fields
    const parsed = uploadFieldsSchema.safeParse({ moduleId, uploadedBy, sourceTitle });
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request fields' },
        { status: 400 }
      );
    }

    if (!file) {
      return Response.json({ error: 'file is required' }, { status: 400 });
    }

    const supabase = createSupabaseClient(env);

    // Extract user identity from JWT or fall back to body field in demo mode
    const user = await extractUser(request, supabase, parsed.data.uploadedBy);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized: invalid or expired token' },
        { status: 401 }
      );
    }

    // Only instructors and admins can upload documents
    if (!requireRole(user, ['instructor', 'admin'])) {
      return Response.json(
        { error: 'Forbidden: insufficient permissions' },
        { status: 403 }
      );
    }

    const authenticatedUserId = user.id;

    // Validate file content type - only accept text-based formats
    const contentType = file.type || 'application/octet-stream';
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return Response.json(
        {
          error: `Unsupported file format: ${contentType}. Only text-based files are currently supported (text/plain, text/markdown, text/csv, application/json). PDF and DOCX support is planned for a future release.`,
        },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const sourceId = crypto.randomUUID();
    const storagePath = `modules/${parsed.data.moduleId}/sources/${sourceId}/${file.name}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { error: storageError } = await supabase.storage
      .from('source-files')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', storageError.message);
      return Response.json(
        { error: 'File storage service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Extract text
    const textContent = await file.text();
    if (textContent.trim().length < 50) {
      return Response.json(
        { error: 'File contains insufficient text content' },
        { status: 400 }
      );
    }

    // Record source in database
    const { error: sourceError } = await supabase.from('sources').insert({
      id: sourceId,
      module_id: parsed.data.moduleId,
      filename: file.name,
      storage_path: storagePath,
      content_type: file.type,
      file_size: file.size,
      status: 'processing',
      uploaded_by: authenticatedUserId,
    });

    if (sourceError) {
      console.error('Source insert error:', sourceError.message);
      return Response.json(
        { error: 'Database service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Chunk text (paragraph-based)
    const paragraphs = textContent.split(/\n\n+/).filter((p) => p.trim().length > 0);
    const chunks: { content: string; index: number }[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length > 800 && currentChunk.length > 0) {
        chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
        currentChunk = para;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      }
    }
    if (currentChunk.trim()) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex });
    }

    // Embed and store each chunk
    const title = parsed.data.sourceTitle || file.name.replace(/\.[^.]+$/, '');

    for (const chunk of chunks) {
      const chunkId = crypto.randomUUID();

      let embedding: number[];
      try {
        embedding = await generateEmbedding(env.AI, chunk.content);
      } catch (error) {
        console.error(`Embedding error for chunk ${chunk.index}:`, error);
        continue;
      }

      const vectorString = `[${embedding.join(',')}]`;

      await supabase.from('source_chunks').insert({
        id: chunkId,
        source_id: sourceId,
        module_id: parsed.data.moduleId,
        chunk_index: chunk.index,
        content: chunk.content,
        section: `${title} - Section ${chunk.index + 1}`,
        embedding: vectorString,
      });
    }

    // Update source status
    await supabase
      .from('sources')
      .update({ status: 'indexed', chunk_count: chunks.length })
      .eq('id', sourceId);

    return Response.json({
      sourceId,
      filename: file.name,
      status: 'indexed',
      chunkCount: chunks.length,
      message: `File processed successfully. ${chunks.length} chunks indexed for retrieval.`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
};
