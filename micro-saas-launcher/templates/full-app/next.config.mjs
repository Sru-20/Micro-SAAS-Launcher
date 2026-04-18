/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack — uses the stable Webpack compiler instead.
  // This avoids the "turbo.createProject not supported by wasm bindings"
  // error that occurs when the native SWC binary falls back to WASM.
  experimental: {
    turbo: undefined,
  },
};

export default nextConfig;
