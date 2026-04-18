'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BuilderPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `any` is acceptable here since we simply stringify the result; unknown
  // was causing a type error when used as a ReactNode below.
  const [blueprint, setBlueprint] = useState<any | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  const onGenerate = async () => {
    if (!idea.trim()) return;
    setPending(true);
    setError(null);
    setProjectId(null);
    setLiveUrl(null);

    try {
      const res = await fetch("/auth/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, deploy: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.details ? `${data.error}: ${data.details}` : (data.error ?? "Failed to generate blueprint.");
        setError(msg);
        setPending(false);
        return;
      }

      const data = await res.json();
      setBlueprint(data.blueprint);
      setProjectId(data.project?.id ?? null);
      if (data.deployment?.ok && data.deployment?.liveUrl) {
        setLiveUrl(data.deployment.liveUrl);
      }
      if (data.deployment && !data.deployment.ok) {
        setError(`Generated project, but deployment failed: ${data.deployment.error}`);
      }
      router.refresh();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Blueprint Builder
        </h1>
        <p className="text-sm text-slate-300">
          Describe your micro-SaaS idea in natural language. We&apos;ll turn it
          into a structured blueprint.
        </p>
      </section>

      <section className="space-y-3">
        <label className="text-sm font-medium text-slate-200">
          Idea description
        </label>
        <textarea
          className="min-h-[120px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-50 outline-none ring-offset-slate-950 placeholder:text-slate-500 focus-visible:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-400"
          placeholder="Example: I want a tool to track customer feedback with voting and tags..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onGenerate}
            disabled={pending || !idea.trim()}
          >
            {pending ? "Generating…" : "Generate blueprint"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIdea("")}
            disabled={pending}
          >
            Clear
          </Button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      {blueprint && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-slate-200">
            Generated blueprint (JSON)
          </h2>
          <pre className="max-h-[360px] overflow-auto rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(blueprint, null, 2)}
          </pre>
          {projectId && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => router.push(`/builder/${projectId}`)}
              >
                Open generated app
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  navigator.clipboard?.writeText(projectId).catch(() => {});
                }}
              >
                Copy project id
              </Button>
              {liveUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(liveUrl, "_blank", "noopener,noreferrer")}
                >
                  Open live site
                </Button>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

