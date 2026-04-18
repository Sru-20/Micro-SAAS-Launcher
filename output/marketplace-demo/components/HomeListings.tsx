"use client";

import { useEffect, useMemo, useState } from "react";
import { PROJECT_ID } from "@/lib/blueprint-config";
import ListingGrid from "@/components/ListingGrid";
import type { Listing } from "@/components/ListingCard";
import { readListings } from "@/lib/local-data";

export default function HomeListings() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const projectId = useMemo(() => PROJECT_ID, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      if (cancelled) return;
      try {
        const data = readListings().slice(0, 6);
        setRows(data);
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
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ marginTop: "1rem" }} className="muted small">
        Loading listings…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginTop: "1rem" }} className="muted small">
        Couldn’t load listings: <span style={{ color: "var(--color-danger)" }}>{error}</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <ListingGrid listings={rows} />
    </div>
  );
}

