import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";
import { navPages, APP_NAME } from "@/lib/blueprint-config";

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME} — Built with Micro-SaaS Launcher`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar pages={navPages} logoText={APP_NAME} />
          <div className="layout-body">{children}</div>
          <Footer appName={APP_NAME} />
        </AuthProvider>
      </body>
    </html>
  );
}
