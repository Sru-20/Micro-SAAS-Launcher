"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneratedFile {
  path: string;
  content: string;
  size: number;
}

interface GenerateResult {
  ok: boolean;
  appName: string;
  projectId: string;
  fileCount: number;
  files: GeneratedFile[];
  fileTree: Array<{ path: string; size: number; dir: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAllAsZipInline(files: GeneratedFile[], appName: string) {
  // Simple approach: download each file as a .txt in a zip-like manifest
  // For a real download, use JSZip (out of scope here)
  const manifest = files
    .map((f) => `// ===== ${f.path} =====\n${f.content}`)
    .join("\n\n");
  downloadTextFile(`${appName}-generated-code.txt`, manifest);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [blueprintJson, setBlueprintJson] = useState("");
  const [projectId, setProjectId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);

  const onGenerate = async () => {
    setError(null);
    setResult(null);
    setSelectedFile(null);

    if (!blueprintJson.trim()) {
      setError("Please paste your blueprint JSON.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(blueprintJson);
    } catch {
      setError("Invalid JSON — please check your blueprint.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprint: parsed, projectId: projectId.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }

      setResult(data as GenerateResult);
      if (data.files?.length > 0) {
        setSelectedFile(data.files[0]);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-10">
      {/* Header */}
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          ⚡ Code Generator
        </h1>
        <p className="text-sm text-slate-300">
          Paste your blueprint JSON below to generate a full Next.js app. The
          engine maps every page and table from your blueprint into ready-to-run
          TypeScript code.
        </p>
      </section>

      {/* Input */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-2 space-y-3">
          <label className="text-sm font-medium text-slate-200">
            Blueprint JSON
          </label>
          <textarea
            className="min-h-[280px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-500"
            placeholder={'{\n  "project_name": "feedback_tracker",\n  "pages": [...],\n  "tables": [...]\n}'}
            value={blueprintJson}
            onChange={(e) => setBlueprintJson(e.target.value)}
            spellCheck={false}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200">
              Project ID <span className="text-slate-500">(optional)</span>
            </label>
            <input
              className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus-visible:border-slate-500"
              placeholder="proj_abc123"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Leave blank to use the project_id from the blueprint.
            </p>
          </div>

          <Button
            type="button"
            onClick={onGenerate}
            disabled={generating || !blueprintJson.trim()}
            className="w-full"
          >
            {generating ? "Generating…" : "🚀 Generate Code"}
          </Button>

          {result && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => downloadAllAsZipInline(result.files, result.appName)}
            >
              ⬇ Download All Files
            </Button>
          )}

          {error && (
            <div className="rounded-md border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-md border border-emerald-900/40 bg-emerald-950/20 p-3 text-sm text-emerald-300">
              ✅ Generated <strong>{result.fileCount}</strong> files for{" "}
              <strong>{result.appName}</strong>
            </div>
          )}
        </div>
      </section>

      {/* File Explorer */}
      {result && (
        <section className="grid gap-4 lg:grid-cols-3">
          {/* File Tree */}
          <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Files ({result.fileCount})
            </div>
            <div className="space-y-0.5 overflow-y-auto" style={{ maxHeight: 480 }}>
              {result.files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
                    selectedFile?.path === file.path
                      ? "bg-slate-800 text-slate-100"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <span className="opacity-50">
                    {file.path.endsWith(".ts") || file.path.endsWith(".tsx")
                      ? "📘"
                      : file.path.endsWith(".css")
                      ? "🎨"
                      : file.path.endsWith(".json")
                      ? "📋"
                      : file.path.startsWith(".env")
                      ? "🔑"
                      : "📄"}
                  </span>
                  <span className="truncate font-mono">{file.path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Preview */}
          <div className="col-span-2 rounded-md border border-slate-800 bg-slate-950">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
                  <span className="font-mono text-xs text-slate-300">
                    {selectedFile.path}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadTextFile(
                        selectedFile.path.split("/").pop() ?? "file.ts",
                        selectedFile.content
                      )
                    }
                  >
                    Download
                  </Button>
                </div>
                <pre
                  className="h-[440px] overflow-auto p-4 font-mono text-xs text-slate-200"
                  style={{ lineHeight: 1.6 }}
                >
                  {selectedFile.content}
                </pre>
              </>
            ) : (
              <div className="flex h-[480px] items-center justify-center text-sm text-slate-500">
                Select a file from the tree to preview
              </div>
            )}
          </div>
        </section>
      )}

      {/* CLI Instructions */}
      <section className="rounded-md border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          📦 Run locally with the CLI
        </h2>
        <pre className="overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-300">
          {`# 1. Save your blueprint JSON
# 2. Run the generator:
npm run generate -- --blueprint ./my-blueprint.json --output ./output/my-app

# 3. Install and run the generated app:
cd output/my-app
npm install
npm run dev`}
        </pre>
        <p className="mt-3 text-xs text-slate-500">
          The generator copies <code className="text-slate-400">templates/full-app/</code> to
          your output directory and populates{" "}
          <code className="text-slate-400">lib/blueprint-config.ts</code> with your blueprint
          data — Navbar, pages, form fields, and Supabase table bindings are all wired automatically.
        </p>
      </section>
    </main>
  );
}
