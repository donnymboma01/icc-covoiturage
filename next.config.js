/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["leaflet"] = path.resolve(
      __dirname,
      "node_modules/leaflet"
    );
    return config;
  },
  experimental: {},
  serverExternalPackages: ["firebase-admin"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/icc-covoitturage.firebasestorage.app/**',
      },
    ],
  },
  output: 'standalone', 
};


module.exports = nextConfig;
