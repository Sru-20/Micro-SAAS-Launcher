"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sanitizeIdentifier } from "@/lib/identifiers";

export type DynamicField = { name: string; type: string };

const SYSTEM_FIELD_NAMES = new Set([
  "id",
  "project_id",
  "created_at",
  "updated_at",
]);

function isSystemField(name: string) {
  return SYSTEM_FIELD_NAMES.has(name.trim().toLowerCase());
}

function normalizeType(type: string) {
  return type.trim().toLowerCase();
}

function coerceValues(fields: DynamicField[], values: Record<string, unknown>) {
  const out: Record<string, unknown> = {};

  for (const field of fields) {
    if (isSystemField(field.name)) continue;
    const key = sanitizeIdentifier(field.name);
    const t = normalizeType(field.type);
    const v = values[key];

    if (t === "integer") {
      if (v === "" || v === null || typeof v === "undefined") out[key] = null;
      else out[key] = Number.isFinite(Number(v)) ? parseInt(String(v), 10) : null;
      continue;
    }

    if (t === "number") {
      if (v === "" || v === null || typeof v === "undefined") out[key] = null;
      else out[key] = Number.isFinite(Number(v)) ? Number(v) : null;
      continue;
    }

    if (t === "boolean") {
      out[key] = Boolean(v);
      continue;
    }

    // text, uuid, timestamp/date are sent as strings (or null)
    if (v === "") out[key] = null;
    else out[key] = v;
  }

  return out;
}

export function DynamicForm({
  fields,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  disabled,
}: {
  fields: DynamicField[];
  initialValues?: Record<string, unknown>;
  submitLabel: string;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
  disabled?: boolean;
}) {
  const sanitizedFields = useMemo(
    () =>
      fields.map((f) => ({
        ...f,
        name: sanitizeIdentifier(f.name),
      })),
    [fields],
  );

  const editableFields = useMemo(
    () =>
      sanitizedFields
        .filter((f) => !isSystemField(f.name))
        .map((f) => f),
    [sanitizedFields],
  );

  const [values, setValues] = useState<Record<string, unknown>>(
    initialValues ?? {},
  );

  const set = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(coerceValues(sanitizedFields, values));
  };

  return (
    <form
      onSubmit={onSubmitInternal}
      className="space-y-3 rounded-md border border-slate-800 bg-slate-950 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {editableFields.map((field) => {
          const t = normalizeType(field.type);
          const name = field.name;
          const value = values[name];

          const label = (
            <label key={`${name}-label`} className="text-xs text-slate-300">
              {name}
            </label>
          );

          if (t === "boolean") {
            return (
              <div key={name} className="space-y-1">
                {label}
                <label className="flex items-center gap-2 text-sm text-slate-100">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => set(name, e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 accent-slate-200"
                  />
                  <span className="text-slate-200">Enabled</span>
                </label>
              </div>
            );
          }

          if (t === "integer" || t === "number") {
            return (
              <div key={name} className="space-y-1">
                {label}
                <Input
                  type="number"
                  value={typeof value === "number" ? String(value) : (value as any) ?? ""}
                  onChange={(e) => set(name, e.target.value)}
                  disabled={disabled}
                  placeholder={t === "integer" ? "0" : "0.0"}
                />
              </div>
            );
          }

          if (t === "timestamp") {
            return (
              <div key={name} className="space-y-1">
                {label}
                <Input
                  type="datetime-local"
                  value={(value as any) ?? ""}
                  onChange={(e) => set(name, e.target.value)}
                  disabled={disabled}
                />
              </div>
            );
          }

          if (t === "date") {
            return (
              <div key={name} className="space-y-1">
                {label}
                <Input
                  type="date"
                  value={(value as any) ?? ""}
                  onChange={(e) => set(name, e.target.value)}
                  disabled={disabled}
                />
              </div>
            );
          }

          const isTextarea =
            t === "text" &&
            (name.toLowerCase().includes("description") ||
              name.toLowerCase().includes("content"));

          if (isTextarea) {
            return (
              <div key={name} className="space-y-1 sm:col-span-2">
                {label}
                <textarea
                  value={(value as any) ?? ""}
                  onChange={(e) => set(name, e.target.value)}
                  disabled={disabled}
                  className="min-h-[96px] w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 shadow-sm outline-none ring-offset-slate-950 placeholder:text-slate-500 focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={`Enter ${name}...`}
                />
              </div>
            );
          }

          return (
            <div key={name} className="space-y-1">
              {label}
              <Input
                value={(value as any) ?? ""}
                onChange={(e) => set(name, e.target.value)}
                disabled={disabled}
                placeholder={`Enter ${name}...`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={disabled}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

