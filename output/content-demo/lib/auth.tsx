"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

type AuthUser = { id: string; name: string };

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  login: (name: string) => void;
  logout: () => void;
};

const STORAGE_KEY = "msa_demo_user_v1";
const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      const maybe = parsed as Record<string, unknown>;
      if (typeof maybe.name === "string") {
        const id =
          typeof maybe.id === "string" && maybe.id
            ? maybe.id
            : crypto.randomUUID();
        return { id, name: maybe.name };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function syncUserToSupabase(user: AuthUser) {
  if (!hasSupabaseEnv()) return;
  try {
    await supabase.from("users").upsert(
      {
        id: user.id,
        email: null,
        full_name: user.name,
        avatar_url: null,
      },
      { onConflict: "id" }
    );
  } catch {
    // local-first auth mode
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    return readStoredUser();
  });
  const [isReady] = useState(true);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      login: (name: string) => {
        const next = {
          id: crypto.randomUUID(),
          name: name.trim() || "Demo User",
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
        void syncUserToSupabase(next);
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [user, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [isReady, user, router, pathname]);

  if (!isReady) return <div className="page-container muted small">Checking session…</div>;
  if (!user) return null;
  return <>{children}</>;
}

export function LoginCard() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/manage/posts";
  const [name, setName] = useState("Demo User");

  return (
    <div className="auth-card">
      <div className="auth-badge">Demo auth</div>
      <h1 className="auth-title">Sign in</h1>
      <p className="auth-subtitle">Sign in to manage your website content.</p>

      <div className="auth-form">
        <label className="form-field">
          <span className="form-label">Display name</span>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <button
          className="btn-primary"
          onClick={() => {
            login(name);
            router.replace(next);
          }}
        >
          Continue <span className="btn-arrow">→</span>
        </button>

        <p className="muted small">Authentication is enabled for manage actions.</p>
      </div>
    </div>
  );
}

