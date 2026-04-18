"use client";

import type { Post } from "@/components/PostCard";

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

export function readPosts(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const rows = seed();
      writePosts(rows);
      return rows;
    }
    const parsed = JSON.parse(raw) as Post[];
    return Array.isArray(parsed) ? parsed : [];
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
}

export function updatePostTitle(id: string, title: string) {
  writePosts(readPosts().map((p) => (p.id === id ? { ...p, title } : p)));
}

export function deletePost(id: string) {
  writePosts(readPosts().filter((p) => p.id !== id));
}

