"use client";

import { moduleRegistry, auditEvents } from "@/lib/data/seed";
import { useApp } from "../providers";

export function AdminRegistry() {
  const { currentUser } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Module Registry</h1>
        <p className="text-slate-500 mt-1">
          Platform administration \u2022 {currentUser.name}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{moduleRegistry.length}</div>
          <div className="text-sm text-slate-500">Total Modules</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{moduleRegistry.filter((m) => m.status === "published").length}</div>
          <div className="text-sm text-slate-500">Published</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{moduleRegistry.filter((m) => m.status === "draft").length}</div>
          <div className="text-sm text-slate-500">Draft</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{moduleRegistry.reduce((s, m) => s + m.totalAttempts, 0)}</div>
          <div className="text-sm text-slate-500">Total Attempts</div>
        </div>
      </div>

      {/* Module table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Registered Modules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Module</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Domain</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Owner</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Version</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Source</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Published</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Last Review</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Usage</th>
              </tr>
            </thead>
            <tbody>
              {moduleRegistry.map((m) => (
                <tr key={m.moduleId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900">{m.title}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{m.domain}</td>
                  <td className="py-3 px-4 text-slate-600">{m.owner}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">{m.activeVersion}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">{m.sourceVersion}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "published"
                        ? "bg-green-100 text-green-700"
                        : m.status === "draft"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {m.publishedAt ? new Date(m.publishedAt).toLocaleDateString() : "\u2014"}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {new Date(m.lastReviewedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-700 font-medium">{m.totalAttempts}</span>
                    <span className="text-slate-400 ml-1 text-xs">
                      ({Math.round(m.completionRate * 100)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Governance warnings */}
      {moduleRegistry.some((m) => m.status === "draft") && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-amber-500">\u26A0\uFE0F</span>
            <div>
              <p className="text-sm font-medium text-amber-900">Governance Notice</p>
              <p className="text-sm text-amber-700 mt-1">
                {moduleRegistry.filter((m) => m.status === "draft").length} module(s) in draft status.
                Draft modules are not visible to learners and require publication approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit trail */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Recent Audit Events</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {auditEvents.map((event) => (
            <div key={event.id} className="px-6 py-4 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <ActionIcon action={event.action} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">{event.details}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{event.actorName}</span>
                  <span className="text-xs text-slate-400">\u2022</span>
                  <span className="text-xs text-slate-400">
                    {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs text-slate-400">\u2022</span>
                  <span className="text-xs font-mono text-slate-400">{event.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ action }: { action: string }) {
  const icons: Record<string, string> = {
    MODULE_PUBLISHED: "\uD83D\uDFE2",
    QUESTIONS_APPROVED: "\u2705",
    SOURCE_UPDATED: "\uD83D\uDCC4",
    THRESHOLD_CHANGED: "\u2699\uFE0F",
  };
  return <span className="text-sm">{icons[action] || "\uD83D\uDD35"}</span>;
}
