import Link from "next/link";
import { APP_NAME } from "@/lib/blueprint-config";
import HomeListings from "@/components/HomeListings";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-wrap">
          <div className="hero-panel">
            <div className="hero-badge">Live template • Marketplace</div>
            <h1 className="hero-title">
              Discover services and listings that feel curated.
            </h1>
            <p className="hero-subtitle">
              {APP_NAME} is a modern marketplace UI with a real working data flow:
              create a listing, browse it, and open a detail page.
            </p>
            <div className="hero-actions">
              <Link className="btn-primary" href="/listings">
                Browse listings <span className="btn-arrow">→</span>
              </Link>
              <Link className="btn-outline" href="/manage/listings">
                Add a listing
              </Link>
            </div>
          </div>

          <div className="hero-side">
            <div className="stat-row">
              <div className="stat">
                <div className="stat-num">Fast</div>
                <div className="stat-label">Next.js app router</div>
              </div>
              <div className="stat">
                <div className="stat-num">Real</div>
                <div className="stat-label">interactive actions</div>
              </div>
              <div className="stat">
                <div className="stat-num">Simple</div>
                <div className="stat-label">works instantly</div>
              </div>
              <div className="stat">
                <div className="stat-num">Polished</div>
                <div className="stat-label">dark UI + cards</div>
              </div>
            </div>
            <div style={{ marginTop: "1rem" }} className="muted small">
              Tip: create your first listing in <b>Manage</b>, then it’ll show up in
              the grid.
            </div>
          </div>
        </div>
      </section>

      <main className="page-container">
        <div className="section-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.01em" }}>
                Recent listings
              </h2>
              <p className="muted small">Live content for your generated website.</p>
            </div>
            <Link className="btn-primary-sm" href="/listings">
              View all
            </Link>
          </div>
          <HomeListings />
        </div>
      </main>
    </>
  );
}

