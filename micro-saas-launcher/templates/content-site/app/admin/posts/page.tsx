"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbTableName, ENABLE_AUTH, PROJECT_ID } from "@/lib/blueprint-config";
import { RequireAuth, useAuth } from "@/lib/auth";

type PostRow = {
  id: string;
  title: string | null;
  content: string | null;
  author_name: string | null;
  created_at?: string | null;
};

function AdminInner() {
  const { user } = useAuth();
  const projectId = useMemo(() => PROJECT_ID, []);

  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  async function refresh() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from(dbTableName("posts"))
      .select("id,title,content,author_name,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as PostRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function createPost() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.from(dbTableName("posts")).insert([
      {
        project_id: projectId,
        title: title.trim() || "Untitled post",
        content: content.trim() || null,
        author_name: user?.name ?? "Demo Author",
      },
    ]);

    if (error) setError(error.message);
    setBusy(false);
    setTitle("");
    setContent("");
    await refresh();
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from(dbTableName("posts")).delete().eq("project_id", projectId).eq("id", id);
    if (error) setError(error.message);
    setBusy(false);
    await refresh();
  }

  async function quickEditTitle(id: string, nextTitle: string) {
    setBusy(true);
    setError(null);
    const { error } = await supabase.from(dbTableName("posts")).update({ title: nextTitle }).eq("project_id", projectId).eq("id", id);
    if (error) setError(error.message);
    setBusy(false);
    await refresh();
  }

  return (
    <main className="page-container">
      <div className="section-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 980, letterSpacing: "-0.02em" }}>Admin • Posts</h1>
            <p className="muted small">
              Create, edit, and delete posts. This page is {ENABLE_AUTH ? "protected by demo auth." : "not protected (auth disabled)."}
            </p>
          </div>
          <Link className="btn-outline" href="/blog">
            View as reader
          </Link>
        </div>

        {error ? (
          <div style={{ marginTop: "1rem", color: "var(--color-danger)" }} className="small">
            {error}
          </div>
        ) : null}

        <div className="admin-grid" style={{ marginTop: "1.2rem" }}>
          <div className="section-card">
            <div style={{ fontWeight: 980, letterSpacing: "-0.01em" }}>Write a post</div>
            <div className="muted small" style={{ marginTop: "0.35rem" }}>
              Publishes to Supabase and shows up immediately in the blog.
            </div>

            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <label className="form-field">
                <span className="form-label">Title</span>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Shipping a fake-functional SaaS" />
              </label>

              <label className="form-field">
                <span className="form-label">Content</span>
                <textarea className="form-textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a few paragraphs…" />
              </label>

              <button className="btn-primary" disabled={busy} onClick={createPost}>
                {busy ? "Publishing…" : "Publish post"} <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>

          <div className="section-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 980, letterSpacing: "-0.01em" }}>All posts</div>
              <button className="btn-outline" onClick={refresh} disabled={busy}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="muted small" style={{ marginTop: "1rem" }}>
                Loading…
              </div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Author</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 900 }}>{r.title || "Untitled"}</div>
                          <div className="muted small" style={{ marginTop: "0.15rem" }}>
                            <Link href={`/blog/${r.id}`} className="muted small">
                              Open post →
                            </Link>
                          </div>
                        </td>
                        <td className="muted small">{r.author_name || "Demo Author"}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn-outline"
                              disabled={busy}
                              onClick={() => {
                                const next = prompt("New title", r.title || "");
                                if (next == null) return;
                                quickEditTitle(r.id, next);
                              }}
                            >
                              Edit
                            </button>
                            <button className="btn-danger" disabled={busy} onClick={() => deletePost(r.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={3}>
                          <div className="empty-state">
                            <div className="empty-icon">✎</div>
                            <div>No posts yet.</div>
                            <div className="muted small">Publish one using the editor on the left.</div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminPostsPage() {
  if (!ENABLE_AUTH) return <AdminInner />;
  return (
    <RequireAuth>
      <AdminInner />
    </RequireAuth>
  );
}

