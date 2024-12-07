/* eslint-disable @typescript-eslint/no-require-imports */
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // your config options here
// };

// module.exports = nextConfig;
// const path = require("path");

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   webpack: (config) => {
//     config.resolve.alias["leaflet"] = path.resolve(
//       __dirname,
//       "node_modules/leaflet"
//     );
//     return config;
//   },
// };

// module.exports = nextConfig;
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
  serverExternalPackages: ["firebase-admin"], // La nouvelle clé correcte
};

module.exports = nextConfig;

// const path = require("path");

// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   webpack: (config) => {
//     config.resolve.alias["leaflet"] = path.resolve(
//       __dirname,
//       "node_modules/leaflet"
//     );
//     return config;
//   },
//   experimental: {
//     serverComponentsExternalPackages: ['firebase-admin']
//   }
// };

// module.exports = nextConfig;
