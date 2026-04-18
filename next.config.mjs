import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    // Pin root to this app folder so Next.js doesn't use a parent lockfile (avoids "multiple lockfiles" + tailwindcss resolve errors)
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
