"use client";

import { FileUpload } from "./file-upload";
import { QuestionGenerator } from "./question-generator";

export function ContentManagement() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Content &amp; AI Generation</h1>
        <p className="text-slate-500 mt-1">
          Upload source material and use AI to generate questions automatically.
        </p>
      </div>

      {/* Workflow explanation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-blue-900 mb-3">How It Works</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-lg">1</div>
            <p className="text-xs text-blue-800 mt-2 font-medium">Upload Source</p>
            <p className="text-xs text-blue-600">PDF, TXT, MD</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-lg">2</div>
            <p className="text-xs text-blue-800 mt-2 font-medium">Auto-Index</p>
            <p className="text-xs text-blue-600">Chunk &amp; embed</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-lg">3</div>
            <p className="text-xs text-blue-800 mt-2 font-medium">AI Generates</p>
            <p className="text-xs text-blue-600">Questions from content</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-lg">4</div>
            <p className="text-xs text-blue-800 mt-2 font-medium">You Approve</p>
            <p className="text-xs text-blue-600">Review &amp; publish</p>
          </div>
        </div>
      </div>

      {/* File upload section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <FileUpload />
      </div>

      {/* Question generation section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <QuestionGenerator />
      </div>
    </div>
  );
}
