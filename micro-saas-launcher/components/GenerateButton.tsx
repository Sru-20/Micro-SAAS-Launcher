"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FieldDef {
  name: string;
  type: string;
}

interface GenerateButtonProps {
  projectId: string;
  projectName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blueprint: any;
}

export function GenerateButton({ projectId, projectName, blueprint }: GenerateButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async () => {
    setStatus("loading");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/generate/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint, projectId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      // Trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = projectName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      a.href = url;
      a.download = `${slug}-app.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus("idle");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Download failed");
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        onClick={handleDownload}
        disabled={status === "loading"}
        className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
      >
        {status === "loading" ? (
          <>
            <span className="animate-spin">⟳</span>
            Generating…
          </>
        ) : (
          <>⬇ Download App</>
        )}
      </Button>
      {status === "error" && errorMsg && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}
