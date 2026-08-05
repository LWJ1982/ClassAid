/**
 * Cloudflare bindings type definitions
 * These match the bindings declared in wrangler.toml
 */

export interface CloudflareEnv {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
}

// D1 Database types
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: object;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// R2 Bucket types
interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2PutOptions {
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
}

interface R2ObjectBody extends R2Object {
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  body: ReadableStream;
}

interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

// Workers AI types
interface Ai {
  run(model: string, inputs: AiTextGenerationInput | AiEmbeddingInput): Promise<unknown>;
}

export interface AiTextGenerationInput {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  max_tokens?: number;
  temperature?: number;
}

export interface AiTextGenerationOutput {
  response: string;
}

export interface AiEmbeddingInput {
  text: string | string[];
}

export interface AiEmbeddingOutput {
  data: number[][];
}

// Vectorize types
interface VectorizeIndex {
  query(vector: number[], options?: VectorizeQueryOptions): Promise<VectorizeMatches>;
  insert(vectors: VectorizeVector[]): Promise<VectorizeMutationResult>;
  upsert(vectors: VectorizeVector[]): Promise<VectorizeMutationResult>;
  deleteByIds(ids: string[]): Promise<VectorizeMutationResult>;
}

interface VectorizeQueryOptions {
  topK?: number;
  filter?: Record<string, string | number>;
  returnMetadata?: boolean;
  returnValues?: boolean;
}

export interface VectorizeMatches {
  matches: VectorizeMatch[];
  count: number;
}

export interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
  values?: number[];
}

export interface VectorizeVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

interface VectorizeMutationResult {
  count: number;
  ids: string[];
}

/**
 * Get Cloudflare bindings from Next.js request context
 * In development, returns null (fallback mode)
 */
export function getCloudflareEnv(): CloudflareEnv | null {
  // In Cloudflare Pages, bindings are available via process.env at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (process as any).env as unknown as CloudflareEnv;
  if (env?.DB && env?.BUCKET && env?.AI && env?.VECTORIZE) {
    return env;
  }
  return null;
}
