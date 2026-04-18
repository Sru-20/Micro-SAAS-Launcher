"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DynamicForm, type DynamicField } from "@/components/DynamicForm";
import { useTableData, type TableRow } from "@/lib/hooks/useTableData";
import { sanitizeIdentifier } from "@/lib/identifiers";

const SYSTEM_FIELD_NAMES = new Set([
  "id",
  "project_id",
  "created_at",
  "updated_at",
]);

function isSystemField(name: string) {
  return SYSTEM_FIELD_NAMES.has(name.trim().toLowerCase());
}

function rowId(row: TableRow): string | null {
  const id = row.id;
  if (typeof id === "string" && id) return id;
  return null;
}

export function AutoCRUD({
  tableName,
  projectId,
  fields,
}: {
  tableName: string;
  projectId: string;
  fields: DynamicField[];
}) {
  const normalizedTableName = useMemo(
    () => sanitizeIdentifier(tableName),
    [tableName],
  );

  const normalizedFields = useMemo(
    () =>
      fields.map((f) => ({
        ...f,
        name: sanitizeIdentifier(f.name),
      })),
    [fields],
  );

  const visibleFields = useMemo(
    () => normalizedFields.filter((f) => !isSystemField(f.name)),
    [normalizedFields],
  );

  const { rows, loading, error, fetchRows, createRow, updateRow, deleteRow } =
    useTableData(normalizedTableName, projectId);

  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<TableRow | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const onCreate = async (values: Record<string, unknown>) => {
    setBusy(true);
    const res = await createRow(values);
    setBusy(false);
    if (!res.ok) return;
    setMode("list");
    await fetchRows();
  };

  const onUpdate = async (values: Record<string, unknown>) => {
    const id = editing ? rowId(editing) : null;
    if (!id) return;
    setBusy(true);
    const res = await updateRow(id, values);
    setBusy(false);
    if (!res.ok) return;
    setMode("list");
    setEditing(null);
    await fetchRows();
  };

  const onDelete = async (row: TableRow) => {
    const id = rowId(row);
    if (!id) return;
    const ok = window.confirm(`Delete this row from "${tableName}"?`);
    if (!ok) return;
    setBusy(true);
    const res = await deleteRow(id);
    setBusy(false);
    if (!res.ok) return;
    await fetchRows();
  };

  const startEdit = (row: TableRow) => {
    setEditing(row);
    setMode("edit");
  };

  return (
    <section className="space-y-3 rounded-md border border-slate-800 bg-slate-900/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-slate-100">
            {normalizedTableName}
          </div>
          <div className="text-xs text-slate-400">
            {loading ? "Loading…" : `${rows.length} row(s)`}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchRows()}
            disabled={busy || loading}
          >
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null);
              setMode("create");
            }}
            disabled={busy}
          >
            New
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {mode === "create" && (
        <DynamicForm
          fields={normalizedFields}
          submitLabel={busy ? "Creating…" : "Create"}
          disabled={busy}
          onSubmit={onCreate}
          onCancel={() => setMode("list")}
        />
      )}

      {mode === "edit" && editing && (
        <DynamicForm
          fields={normalizedFields}
          initialValues={Object.fromEntries(
            visibleFields.map((f) => [f.name, (editing as any)[f.name] ?? ""]),
          )}
          submitLabel={busy ? "Saving…" : "Save"}
          disabled={busy}
          onSubmit={onUpdate}
          onCancel={() => {
            setMode("list");
            setEditing(null);
          }}
        />
      )}

      {mode === "list" && (
        <div className="overflow-auto rounded-md border border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950">
              <tr className="border-b border-slate-800">
                {visibleFields.map((f) => (
                  <th key={f.name} className="px-3 py-2 text-xs font-medium text-slate-300">
                    {f.name}
                  </th>
                ))}
                <th className="px-3 py-2 text-xs font-medium text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900/40">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleFields.length + 1}
                    className="px-3 py-6 text-center text-sm text-slate-400"
                  >
                    No rows yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const id = rowId(row) ?? crypto.randomUUID();
                  return (
                    <tr key={id} className="border-b border-slate-800/70">
                      {visibleFields.map((f) => (
                        <td key={f.name} className="px-3 py-2 text-slate-100">
                          {String((row as any)[f.name] ?? "")}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(row)}
                            disabled={busy}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onDelete(row)}
                            disabled={busy}
                            className="border-red-900/60 text-red-200 hover:bg-red-950/30"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

