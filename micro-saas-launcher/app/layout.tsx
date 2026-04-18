import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micro-SaaS Launcher",
  description: "Launch micro-SaaS apps from AI blueprints",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
