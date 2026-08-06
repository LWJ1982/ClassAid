/**
 * localStorage persistence layer
 * Saves and restores app state across page refreshes
 */

import type { DemoUser } from "@/lib/domain/types";

const STORAGE_KEY = "classaid_state";
const USERS_STORAGE_KEY = "classaid_users";

export interface PersistedState {
  role: string;
  selectedDemoUserId: string;
  activityProgress: number;
  assessmentAnswers: Record<string, string>;
  assessmentSubmitted: boolean;
  readinessResult: unknown;
  attemptAnswers: unknown[];
  moduleConfig: unknown;
}

export function saveState(state: Partial<PersistedState>): void {
  try {
    const existing = loadState();
    const merged = { ...existing, ...state };
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    }
  } catch {
    // Silent fail — localStorage may be unavailable
  }
}

export function loadState(): Partial<PersistedState> | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Silent fail
  }
}

export function saveUsers(users: DemoUser[]): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  } catch {
    // Silent fail — localStorage may be unavailable
  }
}

export function loadUsers(): DemoUser[] | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUser[];
  } catch {
    return null;
  }
}

export function clearUsers(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(USERS_STORAGE_KEY);
    }
  } catch {
    // Silent fail
  }
}
