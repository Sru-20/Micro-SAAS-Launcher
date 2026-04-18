"use client";

import Link from "next/link";

export type Listing = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  seller_name: string | null;
  created_at?: string | null;
};

function formatPrice(price: number | null) {
  if (price == null || Number.isNaN(price)) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(price);
  } catch {
    return `$${price}`;
  }
}

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link className="listing-card" href={`/listings/${listing.id}`}>
      <div className="listing-card-top">
        <div className="listing-title-row">
          <h3 className="listing-title">{listing.title || "Untitled listing"}</h3>
          <span className="listing-price">{formatPrice(listing.price)}</span>
        </div>
        <p className="listing-desc">{listing.description || "No description provided."}</p>
      </div>

      <div className="listing-card-bottom">
        <span className="listing-meta">
          <span className="dot" /> {listing.seller_name || "Demo Seller"}
        </span>
        <span className="listing-cta">
          View <span className="btn-arrow">→</span>
        </span>
      </div>
    </Link>
  );
}

