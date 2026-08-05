"use client";

import { useState, useRef } from "react";
import { useApp } from "../providers";
import { apiClient } from "@/lib/api-client";

export function FileUpload() {
  const { currentUser } = useApp();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ filename: string; chunkCount: number; status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.uploadFile({
        file,
        moduleId: "module-1",
        uploadedBy: currentUser.id,
        sourceTitle: sourceTitle || undefined,
      });

      setResult({
        filename: response.filename,
        chunkCount: response.chunkCount,
        status: response.status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Upload Source Material</h3>
        <p className="text-sm text-slate-500 mt-1">
          Upload module source documents. The system will extract text, chunk it, and create
          embeddings for RAG-based coaching and question generation.
        </p>
      </div>

      {/* Source title input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Source Title (optional)</label>
        <input
          type="text"
          value={sourceTitle}
          onChange={(e) => setSourceTitle(e.target.value)}
          placeholder="e.g., DMM Manual v3.1"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          uploading
            ? "border-blue-300 bg-blue-50"
            : "border-slate-300 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-blue-700 font-medium">Processing file...</p>
            <p className="text-xs text-blue-500">Extracting text, chunking, embedding, indexing...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400">TXT, MD, PDF, DOCX — up to 10MB</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf,.docx,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Success */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-lg">&#x2705;</span>
            <div>
              <p className="text-sm font-medium text-green-800">Upload Successful</p>
              <p className="text-xs text-green-600 mt-0.5">
                <strong>{result.filename}</strong> &mdash; {result.chunkCount} chunks indexed for retrieval
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600 text-lg">&#x274C;</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-xs text-slate-500">
          <strong>What happens after upload:</strong> Text is extracted, split into ~800-token chunks with overlap,
          embedded using Workers AI (BGE-base), and stored in the vector database. The AI Coach will retrieve
          relevant chunks when learners ask questions, and question generation will use this content.
        </p>
      </div>
    </div>
  );
}
