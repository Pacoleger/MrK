/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["@mrk/shared"],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
  },
  trailingSlash: true,
};

export default nextConfig;
