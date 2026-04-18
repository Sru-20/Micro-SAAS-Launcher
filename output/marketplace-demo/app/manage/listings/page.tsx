"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireAuth, useAuth } from "@/lib/auth";
import { createListing, deleteListing, readListings, updateListingTitle } from "@/lib/local-data";
import type { Listing } from "@/components/ListingCard";

function ManageListingsInner() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Listing[]>(() => readListings());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("49");

  function refresh() {
    setRows(readListings());
  }

  function onCreate() {
    createListing({
      title: title.trim() || "Untitled listing",
      description: description.trim() || "",
      price: price.trim() ? Number(price) : null,
      seller_name: user?.name || "Demo Seller",
    });
    setTitle("");
    setDescription("");
    setPrice("49");
    refresh();
  }

  return (
    <main className="page-container">
      <div className="section-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 950, letterSpacing: "-0.02em" }}>Manage listings</h1>
            <p className="muted small">Simple website controls for your marketplace content.</p>
          </div>
          <Link className="btn-outline" href="/listings">View site</Link>
        </div>

        <div className="admin-grid" style={{ marginTop: "1.2rem" }}>
          <div className="section-card">
            <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>New listing</div>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <label className="form-field">
                <span className="form-label">Title</span>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="form-field">
                <span className="form-label">Description</span>
                <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <label className="form-field">
                <span className="form-label">Price</span>
                <input className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} />
              </label>
              <button className="btn-primary" onClick={onCreate}>Publish listing <span className="btn-arrow">→</span></button>
            </div>
          </div>

          <div className="section-card">
            <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>All listings</div>
            <div className="admin-table">
              <table>
                <thead><tr><th>Title</th><th>Price</th><th>Seller</th><th>Actions</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td><Link href={`/listings/${r.id}`}>{r.title || "Untitled"}</Link></td>
                      <td>{r.price == null ? "—" : `$${r.price}`}</td>
                      <td>{r.seller_name || "Demo Seller"}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn-outline"
                            onClick={() => {
                              const next = prompt("New title", r.title || "");
                              if (next == null) return;
                              updateListingTitle(r.id, next);
                              refresh();
                            }}
                          >
                            Edit
                          </button>
                          <button className="btn-danger" onClick={() => { deleteListing(r.id); refresh(); }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ManageListingsPage() {
  return (
    <RequireAuth>
      <ManageListingsInner />
    </RequireAuth>
  );
}

