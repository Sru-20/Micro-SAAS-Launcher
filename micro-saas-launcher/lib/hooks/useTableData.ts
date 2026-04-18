import { useCallback, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-client";

export type TableRow = Record<string, unknown>;

export function useTableData(tableName: string, projectId: string) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setRows([]);
      setLoading(false);
      return { ok: false as const, error: fetchError.message };
    }

    setRows((data ?? []) as TableRow[]);
    setLoading(false);
    return { ok: true as const };
  }, [projectId, supabase, tableName]);

  const createRow = useCallback(
    async (values: Record<string, unknown>) => {
      setError(null);
      const payload = { project_id: projectId, ...values };
      const { error: insertError } = await supabase.from(tableName).insert(payload);
      if (insertError) {
        setError(insertError.message);
        return { ok: false as const, error: insertError.message };
      }
      return { ok: true as const };
    },
    [projectId, supabase, tableName],
  );

  const updateRow = useCallback(
    async (id: string, values: Record<string, unknown>) => {
      setError(null);
      const { error: updateError } = await supabase
        .from(tableName)
        .update(values)
        .eq("id", id)
        .eq("project_id", projectId);

      if (updateError) {
        setError(updateError.message);
        return { ok: false as const, error: updateError.message };
      }
      return { ok: true as const };
    },
    [projectId, supabase, tableName],
  );

  const deleteRow = useCallback(
    async (id: string) => {
      setError(null);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id)
        .eq("project_id", projectId);

      if (deleteError) {
        setError(deleteError.message);
        return { ok: false as const, error: deleteError.message };
      }
      return { ok: true as const };
    },
    [projectId, supabase, tableName],
  );

  return {
    rows,
    loading,
    error,
    fetchRows,
    createRow,
    updateRow,
    deleteRow,
  };
}

