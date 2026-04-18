"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PROJECT_ID } from "@/lib/blueprint-config";
import type { Listing } from "@/components/ListingCard";
import { readListings } from "@/lib/local-data";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const projectId = useMemo(() => PROJECT_ID, []);

  const [row, setRow] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!id) return;
      setLoading(true);
      setError(null);

      if (cancelled) return;
      const data = readListings().find((x) => x.id === id) || null;
      setRow(data);
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
        <Link className="muted small" href="/listings">
          ← Back to listings
        </Link>
      </div>

      {loading ? (
        <div className="section-card">
          <p className="muted small">Loading listing…</p>
        </div>
      ) : error ? (
        <div className="section-card">
          <p className="muted small">
            Couldn’t load listing: <span style={{ color: "var(--color-danger)" }}>{error}</span>
          </p>
        </div>
      ) : !row ? (
        <div className="section-card">
          <h1 style={{ fontSize: "1.3rem", fontWeight: 950 }}>Not found</h1>
          <p className="muted small">This listing doesn’t exist for the current project.</p>
        </div>
      ) : (
        <div className="detail-grid">
          <div className="section-card">
            <h1 className="detail-title">{row.title || "Untitled listing"}</h1>
            <div className="detail-price">
              {row.price == null ? "—" : `$${row.price}`}
            </div>
            <div className="detail-desc">{row.description || "No description provided."}</div>
          </div>

          <div className={`section-card cta-card`}>
            <div style={{ fontWeight: 900, letterSpacing: "-0.01em" }}>Contact seller</div>
            <div className="muted small" style={{ marginTop: "0.35rem" }}>
              Seller: <b>{row.seller_name || "Demo Seller"}</b>
            </div>

            <div className="cta-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setToast("Message sent (demo). The CTA works, but no messaging system is required for the template.");
                  window.setTimeout(() => setToast(null), 2800);
                }}
              >
                Send message <span className="btn-arrow">→</span>
              </button>
              <Link className="btn-outline" href="/manage/listings">
                Manage listing
              </Link>
              {toast ? <div className="muted small">{toast}</div> : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

