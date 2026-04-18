"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ENABLE_AUTH } from "@/lib/blueprint-config";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { syncUserToUsersTable } from "@/lib/user-sync";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type AuthUser = {
  id: string;
  name: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  login: (name: string) => void;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  logout: () => void;
};

const DEMO_STORAGE_KEY = "msa_demo_user_v1";

const AuthContext = createContext<AuthContextValue | null>(null);

function readDemoUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
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

function sessionToAuthUser(u: SupabaseUser | null): AuthUser | null {
  if (!u) return null;
  const meta = u.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    u.email?.split("@")[0] ||
    "Signed in";
  return { id: u.id, name };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(() => !ENABLE_AUTH);

  useEffect(() => {
    if (!ENABLE_AUTH || hasSupabaseEnv()) {
      return;
    }
    void Promise.resolve().then(() => {
      setUser(readDemoUser());
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ENABLE_AUTH || !hasSupabaseEnv()) {
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(sessionToAuthUser(session?.user ?? null));
      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const next = sessionToAuthUser(session?.user ?? null);
      setUser(next);
      if (event === "SIGNED_IN" && session?.user) {
        const r = await syncUserToUsersTable(supabase, session.user);
        if (!r.ok && process.env.NODE_ENV === "development") {
          console.warn("[auth] users table sync:", r.message);
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback((name: string) => {
    const next = {
      id: crypto.randomUUID(),
      name: name.trim() || "Demo User",
    };
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const signInWithGoogle = useCallback(async (nextPath = "/manage/posts") => {
    if (!hasSupabaseEnv()) return;
    const origin = window.location.origin;
    const next = encodeURIComponent(nextPath.startsWith("/") ? nextPath : `/${nextPath}`);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${next}`,
      },
    });
  }, []);

  const logout = useCallback(async () => {
    if (hasSupabaseEnv()) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      login,
      signInWithGoogle,
      logout,
    }),
    [user, isReady, login, signInWithGoogle, logout]
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
    if (!ENABLE_AUTH) return;
    if (!isReady) return;
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [isReady, user, router, pathname]);

  if (!ENABLE_AUTH) {
    return <>{children}</>;
  }

  if (!isReady) {
    return <div className="page-container muted small">Checking session…</div>;
  }

  if (!user) return null;
  return <>{children}</>;
}

export function LoginCard() {
  const { login, signInWithGoogle } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/manage/posts";
  const err = params.get("error");
  const [name, setName] = useState("Demo User");

  return (
    <div className="auth-card">
      <div className="auth-badge">
        {hasSupabaseEnv() ? "Supabase auth" : "Demo auth"}
      </div>
      <h1 className="auth-title">Sign in</h1>
      <p className="auth-subtitle">Sign in to manage your website content.</p>

      {err === "user_sync_failed" && (
        <p className="muted small" style={{ color: "#fca5a5" }}>
          Could not save your profile to the <code>users</code> table. Ensure the table exists and
          RLS allows inserts for <code>auth.uid()</code> (see <code>supabase-rls-users.sql</code>).
        </p>
      )}
      {err === "auth_callback_failed" && (
        <p className="muted small" style={{ color: "#fca5a5" }}>
          Sign-in failed. Check Supabase Auth settings and redirect URLs.
        </p>
      )}

      <div className="auth-form">
        {hasSupabaseEnv() ? (
          <>
            <button
              type="button"
              className="btn-primary"
              onClick={() => void signInWithGoogle(next)}
            >
              Continue with Google <span className="btn-arrow">→</span>
            </button>
            <p className="muted small">
              Sessions use cookies; posts sync when you use the same account that owns this
              project in Supabase.
            </p>
          </>
        ) : (
          <>
            <label className="form-field">
              <span className="form-label">Display name</span>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                login(name);
                router.replace(next);
              }}
            >
              Continue (demo) <span className="btn-arrow">→</span>
            </button>
            <p className="muted small">
              No <code>NEXT_PUBLIC_SUPABASE_*</code> env vars — data stays in the browser only.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
