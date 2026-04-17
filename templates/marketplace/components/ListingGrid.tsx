"use client";

import ListingCard, { type Listing } from "@/components/ListingCard";

export default function ListingGrid({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">▦</div>
        <div>No listings yet.</div>
        <div className="muted small">Sign in and add one from Manage.</div>
      </div>
    );
  }

  return (
    <div className="listing-grid">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}

