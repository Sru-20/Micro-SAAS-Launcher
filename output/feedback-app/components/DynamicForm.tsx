"use client";

import { useState, useMemo } from "react";

export type FieldDef = { name: string; type: string };

const SYSTEM_FIELDS = new Set(["id", "project_id", "created_at", "updated_at"]);

function isSystem(name: string) {
  return SYSTEM_FIELDS.has(name.trim().toLowerCase());
}

function coerce(fields: FieldDef[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (isSystem(f.name)) continue;
    const t = f.type.toLowerCase();
    const v = values[f.name];
    if (t === "integer") out[f.name] = v === "" ? null : parseInt(String(v), 10);
    else if (t === "number") out[f.name] = v === "" ? null : Number(v);
    else if (t === "boolean") out[f.name] = Boolean(v);
    else out[f.name] = v === "" ? null : v;
  }
  return out;
}

export default function DynamicForm({
  fields,
  initialValues = {},
  submitLabel = "Submit",
  disabled,
  onSubmit,
  onCancel,
}: {
  fields: FieldDef[];
  initialValues?: Record<string, unknown>;
  submitLabel?: string;
  disabled?: boolean;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const editable = useMemo(() => fields.filter((f) => !isSystem(f.name)), [fields]);
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (name: string, value: unknown) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await onSubmit(coerce(fields, values));
      setSuccess(true);
      setValues({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dynamic-form-wrapper">
      {success && (
        <div className="form-success">
          ✓ Submitted successfully!
        </div>
      )}
      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="dynamic-form">
        <div className="form-grid">
          {editable.map((f) => {
            const t = f.type.toLowerCase();
            const v = values[f.name];
            const isLong =
              t === "text" &&
              (f.name.includes("description") ||
                f.name.includes("content") ||
                f.name.includes("body") ||
                f.name.includes("comment"));

            return (
              <div
                key={f.name}
                className={`form-field${isLong ? " form-field-wide" : ""}`}
              >
                <label className="form-label">
                  {f.name.replace(/_/g, " ")}
                  <span className="form-type-badge">{f.type}</span>
                </label>

                {t === "boolean" ? (
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={Boolean(v)}
                      onChange={(e) => set(f.name, e.target.checked)}
                      disabled={disabled || submitting}
                      className="form-checkbox"
                    />
                    <span>Enabled</span>
                  </label>
                ) : isLong ? (
                  <textarea
                    value={(v as string) ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    disabled={disabled || submitting}
                    placeholder={`Enter ${f.name.replace(/_/g, " ")}…`}
                    className="form-textarea"
                  />
                ) : (
                  <input
                    type={
                      t === "integer" || t === "number"
                        ? "number"
                        : t === "timestamp"
                        ? "datetime-local"
                        : t === "date"
                        ? "date"
                        : "text"
                    }
                    value={(v as string) ?? ""}
                    onChange={(e) => set(f.name, e.target.value)}
                    disabled={disabled || submitting}
                    placeholder={`Enter ${f.name.replace(/_/g, " ")}…`}
                    className="form-input"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="form-actions">
          <button type="submit" disabled={disabled || submitting} className="btn-submit">
            {submitting ? "Submitting…" : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={disabled || submitting}
              className="btn-cancel"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
