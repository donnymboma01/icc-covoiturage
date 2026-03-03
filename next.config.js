/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      leaflet: path.resolve(__dirname, "node_modules/leaflet"),
    },
  },
  serverExternalPackages: ["firebase-admin"],
  images: {
    qualities: [100, 75],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/icc-covoitturage.firebasestorage.app/**",
      },
    ],
    unoptimized: false,
  },
  output: "standalone",
};

module.exports = withPWA(nextConfig);
