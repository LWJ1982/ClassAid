"use client";

import { learningModule, csModule, domain, domainCS, domains, moduleVersion, csModuleVersion } from "@/lib/data/seed";
import { useApp } from "../providers";
import type { LearningModule, Domain, ModuleVersion } from "@/lib/domain/types";

interface Props {
  onStart: (moduleId: string) => void;
}

// All available modules with their domain and version data
const allModules: { module: LearningModule; domain: Domain; version: ModuleVersion }[] = [
  { module: learningModule, domain, version: moduleVersion },
  { module: csModule, domain: domainCS, version: csModuleVersion },
];

export function LearnerDashboard({ onStart }: Props) {
  const { currentUser, assessmentSubmitted } = useApp();

  // Filter modules to only those in the current learner's domain
  const userDomain = domains.find((d) => d.id === currentUser.domainId);
  const userModules = allModules.filter((m) => m.module.domainId === currentUser.domainId);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {currentUser.name.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1">
          Your assigned learning modules and preparation progress
        </p>
        {userDomain && (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              {userDomain.name}
            </span>
          </div>
        )}
      </div>

      {/* Module Cards */}
      {userModules.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-slate-500">No modules assigned to your domain yet.</p>
        </div>
      )}

      {userModules.map(({ module: mod, domain: modDomain, version: modVersion }) => (
        <div key={mod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {modDomain.name}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    mod.status === "published"
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {mod.status === "published" ? "Published" : "Draft"}
                  </span>
                  {assessmentSubmitted && mod.id === "module-1" && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Completed
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{mod.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{mod.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {mod.estimatedMinutes} min
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Version {modVersion.version}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {modDomain.complianceLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => onStart(mod.id)}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                {assessmentSubmitted && mod.id === "module-1" ? "Review Module" : "Start Preparation"}
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {assessmentSubmitted && mod.id === "module-1"
                  ? "Assessment completed"
                  : "Not yet started"}
              </span>
              <span>
                {mod.id === "module-1" ? "7 activities" : "6 activities"} · 5 assessment questions
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">About Readiness Assessment</p>
            <p className="text-sm text-blue-700 mt-1">
              This module evaluates your understanding of foundational concepts and procedures.
              A readiness assessment does not certify practical competence or replace instructor supervision.
              It identifies areas where additional preparation may be beneficial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
