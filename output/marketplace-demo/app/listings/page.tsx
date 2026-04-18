"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_ID } from "@/lib/blueprint-config";
import ListingGrid from "@/components/ListingGrid";
import type { Listing } from "@/components/ListingCard";
import { readListings } from "@/lib/local-data";

type SortMode = "new" | "price_asc" | "price_desc";

export default function ListingsPage() {
  const projectId = useMemo(() => PROJECT_ID, []);
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("new");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);

      if (cancelled) return;
      try {
        const term = q.trim().toLowerCase();
        let data = readListings();
        if (term) {
          data = data.filter(
            (x) =>
              (x.title || "").toLowerCase().includes(term) ||
              (x.description || "").toLowerCase().includes(term)
          );
        }
        if (sort === "new") data = [...data].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
        if (sort === "price_asc") data = [...data].sort((a, b) => (a.price || 0) - (b.price || 0));
        if (sort === "price_desc") data = [...data].sort((a, b) => (b.price || 0) - (a.price || 0));
        setRows(data.slice(0, 60));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load listings");
        setRows([]);
      }
      setLoading(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [projectId, q, sort]);

  return (
    <main className="page-container">
      <div className="section-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 950, letterSpacing: "-0.02em" }}>Listings</h1>
            <p className="muted small">Search and browse listings scoped to this project.</p>
          </div>
        </div>

        <div className="toolbar">
          <div className="search">
            <input
              className="form-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or description…"
            />
          </div>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as SortMode)}>
            <option value="new">Newest</option>
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </select>
        </div>

        {loading ? (
          <div style={{ marginTop: "1.2rem" }} className="muted small">
            Loading…
          </div>
        ) : error ? (
          <div style={{ marginTop: "1.2rem" }} className="muted small">
            Couldn’t load listings: <span style={{ color: "var(--color-danger)" }}>{error}</span>
          </div>
        ) : (
          <ListingGrid listings={rows} />
        )}
      </div>
    </main>
  );
}

