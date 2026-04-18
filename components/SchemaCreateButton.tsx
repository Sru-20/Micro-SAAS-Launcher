"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SchemaCreateButton({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = async () => {
    setPending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/schema/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ project_id: projectId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data?.error ?? "Failed to create schema");
        setPending(false);
        return;
      }

      if (data?.warning) {
        setMessage(data.warning);
      }

      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" onClick={run} disabled={pending}>
        {pending ? "Creating tables…" : "Create / Sync database tables"}
      </Button>
      {message && <p className="text-xs text-slate-300">{message}</p>}
    </div>
  );
}

