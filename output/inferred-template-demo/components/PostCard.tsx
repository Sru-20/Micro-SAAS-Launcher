"use client";

import Link from "next/link";

export type Post = {
  id: string;
  title: string | null;
  content: string | null;
  author_name: string | null;
  created_at?: string | null;
};

function excerpt(text: string | null, max = 140) {
  const t = (text || "").trim();
  if (!t) return "No content yet.";
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link className="post-card" href={`/blog/${post.id}`}>
      <div className="post-card-top">
        <div className="post-title">{post.title || "Untitled post"}</div>
        <div className="post-excerpt">{excerpt(post.content)}</div>
      </div>
      <div className="post-meta">
        <span className="dot" /> {post.author_name || "Demo Author"}
        <span className="spacer" />
        <span className="read-more">
          Read <span className="btn-arrow">→</span>
        </span>
      </div>
    </Link>
  );
}

