"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/domain/types";
import { apiClient } from "@/lib/api-client";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: Role;
  isLoading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: Role
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createBrowserClient();
  const isDemo = supabase === null;

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!isDemo);

  const role: Role = user?.user_metadata?.role ?? "learner";

  useEffect(() => {
    if (isDemo) return;

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.access_token) {
        apiClient.setAuthToken(initialSession.access_token);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      apiClient.setAuthToken(newSession?.access_token ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemo, supabase]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (!supabase) return { error: "Authentication not configured" };

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    },
    [supabase]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      selectedRole: Role
    ): Promise<{ error: string | null; needsConfirmation: boolean }> => {
      if (!supabase) return { error: "Authentication not configured", needsConfirmation: false };

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: selectedRole },
        },
      });

      if (error) return { error: error.message, needsConfirmation: false };
      return { error: null, needsConfirmation: true };
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    apiClient.setAuthToken(null);
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        isDemo,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
