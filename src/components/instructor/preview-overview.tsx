"use client";

import type { PreviewModuleData } from "./preview-data";

interface Props {
  data: PreviewModuleData;
  onStart: () => void;
}

export function PreviewOverview({ data, onStart }: Props) {
  const { module: mod, domain: modDomain, version: modVersion, objectives: objs, competencies: comps } = data;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {modDomain.name}
          </span>
          <span className="text-xs text-slate-400">v{modVersion.version}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{mod.title}</h1>
        <p className="mt-2 text-slate-600">{mod.description}</p>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-lg font-bold text-slate-900">{mod.estimatedMinutes}</div>
            <div className="text-xs text-slate-500">Minutes</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-lg font-bold text-slate-900">{data.activities.length}</div>
            <div className="text-xs text-slate-500">Activities</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-lg font-bold text-slate-900">{data.questions.length}</div>
            <div className="text-xs text-slate-500">Questions</div>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="text-lg font-bold text-slate-900">{comps.length}</div>
            <div className="text-xs text-slate-500">Competencies</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Learning Objectives</h2>
        <div className="space-y-3">
          {objs.map((obj) => (
            <div key={obj.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {obj.sequence}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{obj.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{obj.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Competencies Assessed</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {comps.map((comp) => (
            <div key={comp.id} className={`p-3 rounded-lg border ${comp.critical ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-900">{comp.name}</p>
                {comp.critical && (
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Critical</span>
                )}
                {comp.mandatory && !comp.critical && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Mandatory</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{comp.description}</p>
              <p className="text-xs text-slate-400 mt-1">Minimum threshold: {Math.round(comp.minimumThreshold * 100)}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onStart}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Begin Guided Activity
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
