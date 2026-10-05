/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
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
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "ufs.sh",
      },
    ],
    unoptimized: false,
  },
  output: "standalone",
};

module.exports = isDev
  ? nextConfig
  : require("next-pwa")({
      dest: "public",
      register: true,
      skipWaiting: true,
      disable: false,
    })(nextConfig);
