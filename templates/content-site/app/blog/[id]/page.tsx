"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PROJECT_ID } from "@/lib/blueprint-config";
import type { Post } from "@/components/PostCard";
import { readPosts } from "@/lib/local-data";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const projectId = useMemo(() => PROJECT_ID, []);

  const [row, setRow] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) return;
      setLoading(true);
      setError(null);

      if (cancelled) return;
      setRow(readPosts().find((p) => p.id === id) || null);
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id, projectId]);

  return (
    <main className="page-container">
      <div style={{ marginBottom: "1rem" }}>
        <Link className="muted small" href="/blog">
          ← Back to blog
        </Link>
      </div>

      {loading ? (
        <div className="section-card muted small">Loading post…</div>
      ) : error ? (
        <div className="section-card muted small">
          Couldn’t load post: <span style={{ color: "var(--color-danger)" }}>{error}</span>
        </div>
      ) : !row ? (
        <div className="section-card">
          <h1 style={{ fontSize: "1.3rem", fontWeight: 980 }}>Not found</h1>
          <p className="muted small">This post doesn’t exist for the current project.</p>
        </div>
      ) : (
        <article className="section-card article">
          <div className="article-head">
            <div className="article-title">{row.title || "Untitled post"}</div>
            <div className="article-meta">
              <span>
                <span className="dot" /> {row.author_name || "Demo Author"}
              </span>
              {row.created_at ? <span>• {new Date(row.created_at).toLocaleString()}</span> : null}
            </div>
          </div>

          <div className="prose">{row.content || "No content."}</div>

          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
            <Link className="btn-outline" href="/manage/posts">
              Manage posts
            </Link>
            <Link className="btn-primary" href="/blog">
              More posts <span className="btn-arrow">→</span>
            </Link>
          </div>
        </article>
      )}
    </main>
  );
}

