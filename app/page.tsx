import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Micro-SaaS Launcher
        </h1>
        <p className="text-slate-300">
          Describe your SaaS idea in natural language. Get a deployed, working app in seconds.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-slate-100 px-6 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-white"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
