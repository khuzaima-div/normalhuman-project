/** @type {import("next").NextConfig} */
const config = {
  // TypeScript ke errors ko build ke waqt ignore karne ke liye
  typescript: {
    ignoreBuildErrors: true,
  },
  // ESLint ke warnings/errors ko build ke waqt ignore karne ke liye
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default config;