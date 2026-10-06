const nextConfig = {
  output: "export",
  trailingSlash: true,      // ← Wichtig!
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
    ],
  },
  transpilePackages: ["@mrk/shared"],
};

export default nextConfig;
