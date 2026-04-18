"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_ID } from "@/lib/blueprint-config";
import PostGrid from "@/components/PostGrid";
import type { Post } from "@/components/PostCard";
import { readPosts } from "@/lib/local-data";

export default function BlogIndexPage() {
  const projectId = useMemo(() => PROJECT_ID, []);
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);

      if (cancelled) return;
      try {
        const term = q.trim().toLowerCase();
        let data = readPosts();
        if (term) {
          data = data.filter(
            (p) =>
              (p.title || "").toLowerCase().includes(term) ||
              (p.content || "").toLowerCase().includes(term)
          );
        }
        data = [...data].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        setRows(data.slice(0, 60));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load posts");
        setRows([]);
      }
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [projectId, q]);

  return (
    <main className="page-container">
      <div className="section-card">
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 980, letterSpacing: "-0.02em" }}>Blog</h1>
          <p className="muted small">Browse and search your published posts.</p>
        </div>

        <div className="toolbar">
          <input
            className="form-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts…"
          />
        </div>

        {loading ? (
          <div style={{ marginTop: "1.2rem" }} className="muted small">Loading…</div>
        ) : error ? (
          <div style={{ marginTop: "1.2rem" }} className="muted small">
            Couldn’t load posts: <span style={{ color: "var(--color-danger)" }}>{error}</span>
          </div>
        ) : (
          <PostGrid posts={rows} />
        )}
      </div>
    </main>
  );
}

