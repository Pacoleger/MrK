/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",          // ← NEU
  images: {
    unoptimized: true,       // ← wichtig bei static export
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
  },
  trailingSlash: true,       // ← empfehlenswert für Cloudflare Pages
};

export default nextConfig;
