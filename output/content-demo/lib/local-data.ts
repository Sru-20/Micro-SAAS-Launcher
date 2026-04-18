"use client";

import type { Post } from "@/components/PostCard";
import { dbTableName, PROJECT_ID } from "@/lib/blueprint-config";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

const STORAGE_KEY = "msa_content_posts_v1";

function seed(): Post[] {
  return [
    {
      id: crypto.randomUUID(),
      title: "Welcome to your new site",
      content: "This is your first post. Edit it from Manage to customize your website.",
      author_name: "Editorial Team",
      created_at: new Date().toISOString(),
    },
  ];
}

function normalizePostForDb(row: Post) {
  return {
    id: row.id,
    project_id: PROJECT_ID,
    title: row.title ?? null,
    content: row.content ?? null,
    author_name: row.author_name ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

async function syncPostsToSupabase(rows: Post[]) {
  if (!hasSupabaseEnv()) return;
  try {
    await supabase.from(dbTableName("posts")).upsert(rows.map(normalizePostForDb), {
      onConflict: "id",
    });
  } catch {
    // local-first mode: ignore sync failures
  }
}

export function readPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const rows = seed();
      writePosts(rows);
      void syncPostsToSupabase(rows);
      return rows;
    }
    const parsed = JSON.parse(raw) as Post[];
    const rows = Array.isArray(parsed) ? parsed : [];
    void syncPostsToSupabase(rows);
    return rows;
  } catch {
    return [];
  }
}

export function writePosts(rows: Post[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function createPost(row: Omit<Post, "id" | "created_at">) {
  const post: Post = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
  const rows = readPosts();
  rows.unshift(post);
  writePosts(rows);
  void syncPostsToSupabase(rows);
}

export function updatePostTitle(id: string, title: string) {
  const rows = readPosts().map((p) => (p.id === id ? { ...p, title } : p));
  writePosts(rows);
  void syncPostsToSupabase(rows);
}

export function deletePost(id: string) {
  const rows = readPosts().filter((p) => p.id !== id);
  writePosts(rows);
  if (hasSupabaseEnv()) {
    void supabase
      .from(dbTableName("posts"))
      .delete()
      .eq("project_id", PROJECT_ID)
      .eq("id", id);
  }
}

