/**
 * API route helpers for Cloudflare Workers runtime
 */

import { NextResponse } from "next/server";
import type { CloudflareEnv } from "./cloudflare";
import { getCloudflareEnv } from "./cloudflare";

export function getEnv(): CloudflareEnv | null {
  return getCloudflareEnv();
}

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function generateId(prefix: string = ""): string {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}-${id}` : id;
}

/**
 * Chunk text into overlapping segments for embedding
 */
export function chunkText(
  text: string,
  options: { maxChunkSize?: number; overlap?: number } = {}
): { content: string; index: number }[] {
  const { maxChunkSize = 800, overlap = 100 } = options;
  const chunks: { content: string; index: number }[] = [];

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if ((currentChunk + "\n\n" + para).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
      // Keep overlap from end of current chunk
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(" ") + "\n\n" + para;
    } else {
      currentChunk = currentChunk ? currentChunk + "\n\n" + para : para;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({ content: currentChunk.trim(), index: chunkIndex });
  }

  return chunks;
}

/**
 * Detect section headings in text for citation metadata
 */
export function detectSection(text: string): string | null {
  const lines = text.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Match patterns like "Section 3.2 — Title" or "## Title" or numbered headings
    if (/^(#{1,3}\s|Section\s\d|Chapter\s\d|\d+\.\d*\s)/i.test(trimmed)) {
      return trimmed.replace(/^#+\s*/, "");
    }
  }
  return null;
}
