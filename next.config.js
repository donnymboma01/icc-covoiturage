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
  webpack: (config) => {
    config.resolve.alias["leaflet"] = path.resolve(
      __dirname,
      "node_modules/leaflet"
    );
    return config;
  },
  experimental: {
    turbopack: {},
  },
  serverExternalPackages: ["firebase-admin"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/icc-covoitturage.firebasestorage.app/**",
      },
    ],
  },
  output: "standalone",
};

module.exports = withPWA(nextConfig);
