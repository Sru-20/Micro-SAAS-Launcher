"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireAuth, useAuth } from "@/lib/auth";
import { createPost, deletePost, readPosts, updatePostTitle } from "@/lib/local-data";
import type { Post } from "@/components/PostCard";

function ManagePostsInner() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Post[]>(() => readPosts());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function refresh() {
    setRows(readPosts());
  }

  function onCreate() {
    createPost({
      title: title.trim() || "Untitled post",
      content: content.trim() || "",
      author_name: user?.name || "Demo Author",
    });
    setTitle("");
    setContent("");
    refresh();
  }

  return (
    <main className="page-container">
      <div className="section-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 980, letterSpacing: "-0.02em" }}>Manage posts</h1>
            <p className="muted small">Write and update website content.</p>
          </div>
          <Link className="btn-outline" href="/blog">View blog</Link>
        </div>

        <div className="admin-grid" style={{ marginTop: "1.2rem" }}>
          <div className="section-card">
            <div style={{ fontWeight: 980, letterSpacing: "-0.01em" }}>Write a post</div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <label className="form-field">
                <span className="form-label">Title</span>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="form-field">
                <span className="form-label">Content</span>
                <textarea className="form-textarea" value={content} onChange={(e) => setContent(e.target.value)} />
              </label>
              <button className="btn-primary" onClick={onCreate}>Publish post <span className="btn-arrow">→</span></button>
            </div>
          </div>

          <div className="section-card">
            <div style={{ fontWeight: 980, letterSpacing: "-0.01em" }}>All posts</div>
            <div className="admin-table">
              <table>
                <thead><tr><th>Title</th><th>Author</th><th>Actions</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td><Link href={`/blog/${r.id}`}>{r.title || "Untitled"}</Link></td>
                      <td>{r.author_name || "Demo Author"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn-outline"
                            onClick={() => {
                              const next = prompt("New title", r.title || "");
                              if (next == null) return;
                              updatePostTitle(r.id, next);
                              refresh();
                            }}
                          >
                            Edit
                          </button>
                          <button className="btn-danger" onClick={() => { deletePost(r.id); refresh(); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ManagePostsPage() {
  return (
    <RequireAuth>
      <ManagePostsInner />
    </RequireAuth>
  );
}

