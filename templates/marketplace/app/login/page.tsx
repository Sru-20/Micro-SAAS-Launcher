"use client";

import { Suspense } from "react";
import { ENABLE_AUTH } from "@/lib/blueprint-config";
import { LoginCard } from "@/lib/auth";

export default function LoginPage() {
  if (!ENABLE_AUTH) {
    return (
      <main className="page-container">
        <div className="section-card">
          <h1 style={{ fontSize: "1.4rem", fontWeight: 950 }}>Auth is disabled</h1>
          <p className="muted small" style={{ marginTop: "0.35rem" }}>
            Add <b>&quot;auth&quot;</b> to <code>blueprint.modules</code> to enable the demo login flow.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="auth-shell">
      <Suspense fallback={<div className="muted small">Loading…</div>}>
        <LoginCard />
      </Suspense>
    </div>
  );
}

