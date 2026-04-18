'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGoogle = async () => {
    setPending(true);
    setError(null);

    const redirectTo =
      `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    setPending(false);

    if (error) setError(error.message);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const qp = new URLSearchParams(window.location.search);
    if (qp.get("error") === "user_sync_failed") {
      setError(
        "Sign-in worked, but we could not save your user profile in the users table."
      );
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }

    const syncRes = await fetch("/auth/sync-user", { method: "POST" });
    if (!syncRes.ok) {
      setError(
        "Sign-in worked, but we could not save your user profile in the users table."
      );
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-slate-900/60 p-8 shadow-lg">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={pending}
          onClick={onGoogle}
        >
          Continue with Google
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-800" />
          <span className="text-xs text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1 text-left">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={pending}
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}

