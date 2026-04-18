import Link from "next/link";
import { APP_NAME } from "@/lib/blueprint-config";
import HomePosts from "@/components/HomePosts";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-wrap">
          <div className="hero-badge">Live template • Content</div>
          <h1 className="hero-title">A modern blog that actually works.</h1>
          <p className="hero-subtitle">
            {APP_NAME} ships a polished homepage, real blog pages, and a simple writer flow.
          </p>
          <div className="hero-actions">
            <Link className="btn-primary" href="/blog">
              Read posts <span className="btn-arrow">→</span>
            </Link>
            <Link className="btn-outline" href="/manage/posts">
              Write a post
            </Link>
          </div>
        </div>
      </section>

      <main className="page-container">
        <div className="section-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 950, letterSpacing: "-0.01em" }}>Latest posts</h2>
              <p className="muted small">Live content for your website.</p>
            </div>
            <Link className="btn-primary-sm" href="/blog">
              View all
            </Link>
          </div>
          <HomePosts />
        </div>
      </main>
    </>
  );
}

