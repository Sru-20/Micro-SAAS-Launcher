"use client";

import PostCard, { type Post } from "@/components/PostCard";

export default function PostGrid({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">✎</div>
        <div>No posts yet.</div>
        <div className="muted small">Sign in and create one from Manage.</div>
      </div>
    );
  }

  return (
    <div className="post-grid">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

