"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_ID } from "@/lib/blueprint-config";
import PostGrid from "@/components/PostGrid";
import type { Post } from "@/components/PostCard";
import { readPosts } from "@/lib/local-data";

export default function HomePosts() {
  const projectId = useMemo(() => PROJECT_ID, []);
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      if (cancelled) return;
      try {
        setRows(readPosts().slice(0, 6));
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
  }, [projectId]);

  if (loading) return <div style={{ marginTop: "1rem" }} className="muted small">Loading posts…</div>;
  if (error) return <div style={{ marginTop: "1rem" }} className="muted small">Couldn’t load posts: <span style={{ color: "var(--color-danger)" }}>{error}</span></div>;

  return (
    <div style={{ marginTop: "1rem" }}>
      <PostGrid posts={rows} />
    </div>
  );
}

