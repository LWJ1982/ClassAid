-- Vector similarity search function for RAG queries
-- Uses cosine similarity via pgvector <=> operator

CREATE OR REPLACE FUNCTION match_source_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_module_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  module_id uuid,
  content text,
  section text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.source_id,
    sc.module_id,
    sc.content,
    sc.section,
    sc.chunk_index,
    (1 - (sc.embedding <=> query_embedding))::float AS similarity
  FROM source_chunks sc
  WHERE
    sc.embedding IS NOT NULL
    AND (filter_module_id IS NULL OR sc.module_id = filter_module_id)
    AND (1 - (sc.embedding <=> query_embedding)) > match_threshold
  ORDER BY sc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
