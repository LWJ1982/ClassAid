"use client";

import { useState } from "react";
import { useApp } from "../providers";
import { domains } from "@/lib/data/seed";
import type { DemoUser, Role } from "@/lib/domain/types";

export function UserManagement() {
  const { currentUser, users, addUser, removeUser } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"learner" | "instructor">("learner");
  const [formDomainId, setFormDomainId] = useState(domains[0]?.id ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddUser = () => {
    if (!formName.trim() || !formEmail.trim()) return;
    setFormError(null);

    const newUser: DemoUser = {
      id: `user-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      role: formRole as Role,
      domainId: formDomainId,
    };

    const success = addUser(newUser);
    if (!success) {
      setFormError("A user with this email already exists.");
      return;
    }
    setFormName("");
    setFormEmail("");
    setFormRole("learner");
    setFormDomainId(domains[0]?.id ?? "");
    setShowAddForm(false);
  };

  const [removeError, setRemoveError] = useState<string | null>(null);

  const handleRemoveUser = (userId: string) => {
    setRemoveError(null);
    const success = removeUser(userId);
    if (!success) {
      setRemoveError("Cannot remove the currently active demo user. Switch to a different user first.");
    }
    setConfirmRemoveId(null);
  };

  const learners = users.filter((u) => u.role === "learner");
  const instructors = users.filter((u) => u.role === "instructor");
  const admins = users.filter((u) => u.role === "admin");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">
            Manage learners and instructors - {currentUser.name}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add User
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{users.length}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{learners.length}</div>
          <div className="text-sm text-slate-500">Learners</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{instructors.length}</div>
          <div className="text-sm text-slate-500">Instructors</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{admins.length}</div>
          <div className="text-sm text-slate-500">Admins</div>
        </div>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Add New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                id="user-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="user-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. jane.smith@university.edu"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="user-role" className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <select
                id="user-role"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as "learner" | "instructor")}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="learner">Learner</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <div>
              <label htmlFor="user-domain" className="block text-sm font-medium text-slate-700 mb-1">
                Domain
              </label>
              <select
                id="user-domain"
                value={formDomainId}
                onChange={(e) => setFormDomainId(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            {formError && (
              <p className="text-sm text-red-600 mr-auto">{formError}</p>
            )}
            <button
              onClick={handleAddUser}
              disabled={!formName.trim() || !formEmail.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add User
            </button>
            <button
              onClick={() => { setShowAddForm(false); setFormError(null); }}
              className="inline-flex items-center px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Remove error */}
      {removeError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {removeError}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Domain</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const userDomain = domains.find((d) => d.id === u.domainId);
                const isCurrentUser = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-900">{u.name}</span>
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-slate-400">(you)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {userDomain ? userDomain.name : "-"}
                    </td>
                    <td className="py-3 px-4">
                      {isCurrentUser ? (
                        <span className="text-xs text-slate-400">Cannot remove self</span>
                      ) : confirmRemoveId === u.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRemoveUser(u.id)}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemoveId(u.id)}
                          className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    learner: "bg-blue-100 text-blue-700",
    instructor: "bg-purple-100 text-purple-700",
    admin: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[role]}`}>
      {role}
    </span>
  );
}
