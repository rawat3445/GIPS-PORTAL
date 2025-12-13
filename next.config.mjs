/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["@"] = new URL("./src", import.meta.url).pathname;
    return config;
  },

  // ✅ This disables Turbopack conflict
  turbopack: {},
};

export default nextConfig;
