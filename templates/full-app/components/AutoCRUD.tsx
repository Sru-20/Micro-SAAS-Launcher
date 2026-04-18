"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { dbTableName } from "@/lib/blueprint-config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FieldDef = { name: string; type: string };
type Row = Record<string, unknown>;

// ─── Supabase singleton ───────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SYSTEM_FIELDS = new Set(["id", "project_id", "created_at", "updated_at"]);

function isSystem(name: string) {
  return SYSTEM_FIELDS.has(name.trim().toLowerCase());
}

function rowId(row: Row): string | null {
  const id = row["id"];
  return typeof id === "string" && id ? id : null;
}

// ─── DynamicForm (inline) ────────────────────────────────────────────────────

function InlineForm({
  fields,
  initialValues = {},
  submitLabel,
  disabled,
  onSubmit,
  onCancel,
}: {
  fields: FieldDef[];
  initialValues?: Record<string, unknown>;
  submitLabel: string;
  disabled?: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const editable = fields.filter((f) => !isSystem(f.name));
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  const set = (name: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const coerced: Record<string, unknown> = {};
    for (const f of editable) {
      const v = values[f.name];
      const t = f.type.toLowerCase();
      if (t === "integer") coerced[f.name] = v === "" ? null : parseInt(String(v), 10);
      else if (t === "number") coerced[f.name] = v === "" ? null : Number(v);
      else if (t === "boolean") coerced[f.name] = Boolean(v);
      else coerced[f.name] = v === "" ? null : v;
    }
    await onSubmit(coerced);
  };

  return (
    <form onSubmit={handleSubmit} className="inline-form">
      <div className="form-grid">
        {editable.map((f) => {
          const t = f.type.toLowerCase();
          const v = values[f.name];
          const isLong =
            t === "text" &&
            (f.name.includes("description") || f.name.includes("content") || f.name.includes("body"));

          return (
            <div key={f.name} className={`form-field${isLong ? " form-field-wide" : ""}`}>
              <label className="form-label">{f.name}</label>
              {t === "boolean" ? (
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(v)}
                    onChange={(e) => set(f.name, e.target.checked)}
                    disabled={disabled}
                    className="form-checkbox"
                  />
                  <span>Enabled</span>
                </label>
              ) : isLong ? (
                <textarea
                  value={(v as string) ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  disabled={disabled}
                  placeholder={`Enter ${f.name}…`}
                  className="form-textarea"
                />
              ) : (
                <input
                  type={t === "integer" || t === "number" ? "number" : t === "timestamp" ? "datetime-local" : t === "date" ? "date" : "text"}
                  value={(v as string) ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                  disabled={disabled}
                  placeholder={`Enter ${f.name}…`}
                  className="form-input"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={disabled} className="btn-submit">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={disabled} className="btn-cancel">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// ─── AutoCRUD ────────────────────────────────────────────────────────────────

export default function AutoCRUD({
  tableName,
  projectId,
  fields,
}: {
  tableName: string;
  projectId: string;
  fields: FieldDef[];
}) {
  const supabase = useMemo(() => getSupabase(), []);
  const dbTable = useMemo(() => dbTableName(tableName), [tableName]);
  const visibleFields = useMemo(() => fields.filter((f) => !isSystem(f.name)), [fields]);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from(dbTable)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [supabase, tableName, projectId]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const onCreate = async (values: Record<string, unknown>) => {
    setBusy(true);
    const { error: err } = await supabase
      .from(dbTable)
      .insert({ project_id: projectId, ...values });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setMode("list");
    fetchRows();
  };

  const onUpdate = async (values: Record<string, unknown>) => {
    const id = editing ? rowId(editing) : null;
    if (!id) return;
    setBusy(true);
    const { error: err } = await supabase
      .from(dbTable)
      .update(values)
      .eq("id", id)
      .eq("project_id", projectId);
    setBusy(false);
    if (err) { setError(err.message); return; }
    setMode("list");
    setEditing(null);
    fetchRows();
  };

  const onDelete = async (row: Row) => {
    const id = rowId(row);
    if (!id) return;
    if (!window.confirm(`Delete this row from "${tableName}"?`)) return;
    setBusy(true);
    const { error: err } = await supabase
      .from(dbTable)
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);
    setBusy(false);
    if (err) setError(err.message);
    else fetchRows();
  };

  return (
    <section className="crud-section">
      <div className="crud-header">
        <div>
          <div className="crud-table-name">{tableName}</div>
          <div className="crud-row-count">
            {loading ? "Loading…" : `${rows.length} row(s)`}
          </div>
        </div>
        <div className="crud-actions">
          <button onClick={() => fetchRows()} disabled={busy || loading} className="btn-outline">
            Refresh
          </button>
          <button
            onClick={() => { setEditing(null); setMode("create"); }}
            disabled={busy}
            className="btn-primary-sm"
          >
            + New
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {mode === "create" && (
        <InlineForm
          fields={fields}
          submitLabel={busy ? "Creating…" : "Create"}
          disabled={busy}
          onSubmit={onCreate}
          onCancel={() => setMode("list")}
        />
      )}

      {mode === "edit" && editing && (
        <InlineForm
          fields={fields}
          initialValues={Object.fromEntries(
            visibleFields.map((f) => [f.name, (editing as any)[f.name] ?? ""])
          )}
          submitLabel={busy ? "Saving…" : "Save"}
          disabled={busy}
          onSubmit={onUpdate}
          onCancel={() => { setMode("list"); setEditing(null); }}
        />
      )}

      {mode === "list" && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {visibleFields.map((f) => (
                  <th key={f.name}>{f.name}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={visibleFields.length + 1} className="empty-state">
                    No rows yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const id = rowId(row) ?? crypto.randomUUID();
                  return (
                    <tr key={id}>
                      {visibleFields.map((f) => (
                        <td key={f.name}>{String((row as any)[f.name] ?? "")}</td>
                      ))}
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => { setEditing(row); setMode("edit"); }}
                            disabled={busy}
                            className="btn-row-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(row)}
                            disabled={busy}
                            className="btn-row-delete"
                          >
                            Delete
                          </button>
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
