"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbTableName, ENABLE_AUTH, PROJECT_ID } from "@/lib/blueprint-config";
import { RequireAuth, useAuth } from "@/lib/auth";
import Link from "next/link";

type ListingRow = {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  seller_name: string | null;
  created_at?: string | null;
};

function AdminInner() {
  const { user } = useAuth();
  const projectId = useMemo(() => PROJECT_ID, []);

  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("49");

  async function refresh() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from(dbTableName("listings"))
      .select("id,title,description,price,seller_name,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as ListingRow[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function createListing() {
    setBusy(true);
    setError(null);

    const numericPrice = price.trim() ? Number(price) : null;
    const { error } = await supabase.from(dbTableName("listings")).insert([
      {
        project_id: projectId,
        title: title.trim() || "Untitled listing",
        description: description.trim() || null,
        price: numericPrice,
        seller_name: user?.name ?? "Demo Seller",
      },
    ]);

    if (error) setError(error.message);
    setBusy(false);
    setTitle("");
    setDescription("");
    setPrice("49");
    await refresh();
  }

  async function deleteListing(id: string) {
    if (!confirm("Delete this listing?")) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from(dbTableName("listings")).delete().eq("project_id", projectId).eq("id", id);
    if (error) setError(error.message);
    setBusy(false);
    await refresh();
  }

  async function quickEditTitle(id: string, nextTitle: string) {
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from(dbTableName("listings"))
      .update({ title: nextTitle })
      .eq("project_id", projectId)
      .eq("id", id);
    if (error) setError(error.message);
    setBusy(false);
    await refresh();
  }

  return (
    <main className="page-container">
      <div className="section-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 950, letterSpacing: "-0.02em" }}>Admin • Listings</h1>
            <p className="muted small">
              Create, edit, and delete listings. This page is {ENABLE_AUTH ? "protected by demo auth." : "not protected (auth disabled)."}
            </p>
          </div>
          <Link className="btn-outline" href="/listings">
            View as customer
          </Link>
        </div>

        {error ? (
          <div style={{ marginTop: "1rem", color: "var(--color-danger)" }} className="small">
            {error}
          </div>
        ) : null}

        <div className="admin-grid" style={{ marginTop: "1.2rem" }}>
          <div className="section-card">
            <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>Create listing</div>
            <div className="muted small" style={{ marginTop: "0.35rem" }}>
              Adds a row in Supabase with your <code>project_id</code>.
            </div>

            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <label className="form-field">
                <span className="form-label">Title</span>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Landing page design" />
              </label>

              <label className="form-field">
                <span className="form-label">Description</span>
                <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What’s included, delivery time, etc." />
              </label>

              <label className="form-field">
                <span className="form-label">Price</span>
                <input className="form-input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49" />
              </label>

              <button className="btn-primary" disabled={busy} onClick={createListing}>
                {busy ? "Saving…" : "Create listing"} <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>

          <div className="section-card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 950, letterSpacing: "-0.01em" }}>All listings</div>
              <button className="btn-outline" onClick={refresh} disabled={busy}>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="muted small" style={{ marginTop: "1rem" }}>
                Loading…
              </div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Price</th>
                      <th>Seller</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 850 }}>{r.title || "Untitled"}</div>
                          <div className="muted small" style={{ marginTop: "0.15rem" }}>
                            <Link href={`/listings/${r.id}`} className="muted small">
                              Open detail →
                            </Link>
                          </div>
                        </td>
                        <td>{r.price == null ? "—" : `$${r.price}`}</td>
                        <td className="muted small">{r.seller_name || "Demo Seller"}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn-outline"
                              disabled={busy}
                              onClick={() => {
                                const next = prompt("New title", r.title || "");
                                if (next == null) return;
                                quickEditTitle(r.id, next);
                              }}
                            >
                              Edit
                            </button>
                            <button className="btn-danger" disabled={busy} onClick={() => deleteListing(r.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <div className="empty-state">
                            <div className="empty-icon">▦</div>
                            <div>No listings yet.</div>
                            <div className="muted small">Create one using the form on the left.</div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminListingsPage() {
  if (!ENABLE_AUTH) return <AdminInner />;
  return (
    <RequireAuth>
      <AdminInner />
    </RequireAuth>
  );
}

