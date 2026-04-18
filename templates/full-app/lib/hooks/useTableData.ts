"use client";

import { useCallback, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  }, [tableName, projectId]);

  const createRow = useCallback(
    async (values: Record<string, unknown>) => {
      const { error: err } = await supabase
        .from(dbTable)
        .insert({ project_id: projectId, ...values });
      if (err) { setError(err.message); return { ok: false as const }; }
      return { ok: true as const };
    },
    [dbTable, projectId]
  );

  const updateRow = useCallback(
    async (id: string, values: Record<string, unknown>) => {
      const { error: err } = await supabase
        .from(dbTable)
        .update(values)
        .eq("id", id)
        .eq("project_id", projectId);
      if (err) { setError(err.message); return { ok: false as const }; }
      return { ok: true as const };
    },
    [dbTable, projectId]
  );

  const deleteRow = useCallback(
    async (id: string) => {
      const { error: err } = await supabase
        .from(dbTable)
        .delete()
        .eq("id", id)
        .eq("project_id", projectId);
      if (err) { setError(err.message); return { ok: false as const }; }
      return { ok: true as const };
    },
    [dbTable, projectId]
  );

  return { rows, loading, error, fetchRows, createRow, updateRow, deleteRow };
}
