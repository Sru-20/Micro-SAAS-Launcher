"use client";

import type { Listing } from "@/components/ListingCard";
import { dbTableName, PROJECT_ID } from "@/lib/blueprint-config";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";

const STORAGE_KEY = "msa_marketplace_listings_v1";

function fallbackSeed(): Listing[] {
  return [
    {
      id: crypto.randomUUID(),
      title: "Landing Page Design",
      description: "Modern landing page design and responsive build.",
      price: 199,
      seller_name: "Studio Nova",
      created_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: "SEO Content Package",
      description: "4 SEO-friendly blog posts with keyword research.",
      price: 120,
      seller_name: "Content Lab",
      created_at: new Date().toISOString(),
    },
  ];
}

function normalizeListingForDb(row: Listing) {
  return {
    id: row.id,
    project_id: PROJECT_ID,
    title: row.title ?? null,
    description: row.description ?? null,
    price: row.price ?? null,
    seller_name: row.seller_name ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
  };
}

async function syncListingsToSupabase(rows: Listing[]) {
  if (!hasSupabaseEnv()) return;
  try {
    await supabase.from(dbTableName("listings")).upsert(rows.map(normalizeListingForDb), {
      onConflict: "id",
    });
  } catch {
    // keep UX local-first; ignore remote sync errors
  }
}

export function readListings(): Listing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = fallbackSeed();
      writeListings(seeded);
      void syncListingsToSupabase(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Listing[];
    const rows = Array.isArray(parsed) ? parsed : [];
    void syncListingsToSupabase(rows);
    return rows;
  } catch {
    return [];
  }
}

export function writeListings(rows: Listing[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function createListing(row: Omit<Listing, "id" | "created_at">): Listing {
  const next: Listing = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...row,
  };
  const rows = readListings();
  rows.unshift(next);
  writeListings(rows);
  void syncListingsToSupabase(rows);
  return next;
}

export function updateListingTitle(id: string, title: string) {
  const rows = readListings().map((r) => (r.id === id ? { ...r, title } : r));
  writeListings(rows);
  void syncListingsToSupabase(rows);
}

export function deleteListing(id: string) {
  const rows = readListings().filter((r) => r.id !== id);
  writeListings(rows);
  if (hasSupabaseEnv()) {
    void supabase
      .from(dbTableName("listings"))
      .delete()
      .eq("project_id", PROJECT_ID)
      .eq("id", id);
  }
}

