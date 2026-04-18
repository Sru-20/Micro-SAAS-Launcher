"use client";

import { useCallback, useMemo, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { dbTableName } from "@/lib/blueprint-config";

export type TableRow = Record<string, unknown>;

export function useTableData(tableName: string, projectId: string) {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dbTable = useMemo(() => dbTableName(tableName), [tableName]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!hasSupabaseEnv()) {
      setError(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — configure .env.local to load data."
      );
      setRows([]);
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase
      .from(dbTable)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setRows([]);
    } else {
      setRows((data ?? []) as TableRow[]);
    }
    setLoading(false);
  }, [dbTable, projectId]);

  const createRow = useCallback(
    async (values: Record<string, unknown>) => {
      if (!hasSupabaseEnv()) {
        setError("Configure Supabase env vars before creating rows.");
        return { ok: false as const };
      }
      const { error: err } = await supabase
        .from(dbTable)
        .insert({ project_id: projectId, ...values });
      if (err) {
        setError(err.message);
        return { ok: false as const };
      }
      return { ok: true as const };
    },
    [dbTable, projectId]
  );

  const updateRow = useCallback(
    async (id: string, values: Record<string, unknown>) => {
      if (!hasSupabaseEnv()) {
        setError("Configure Supabase env vars before updating rows.");
        return { ok: false as const };
      }
      const { error: err } = await supabase
        .from(dbTable)
        .update(values)
        .eq("id", id)
        .eq("project_id", projectId);
      if (err) {
        setError(err.message);
        return { ok: false as const };
      }
      return { ok: true as const };
    },
    [dbTable, projectId]
  );

  const deleteRow = useCallback(
    async (id: string) => {
      if (!hasSupabaseEnv()) {
        setError("Configure Supabase env vars before deleting rows.");
        return { ok: false as const };
      }
      const { error: err } = await supabase
        .from(dbTable)
        .delete()
        .eq("id", id)
        .eq("project_id", projectId);
      if (err) {
        setError(err.message);
        return { ok: false as const };
      }
      return { ok: true as const };
    },
    [dbTable, projectId]
  );

  return { rows, loading, error, fetchRows, createRow, updateRow, deleteRow };
}
