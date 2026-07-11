/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    // Pre-existing lint debt across legacy files; TypeScript is enforced at build time.
    ignoreDuringBuilds: true,
  },
};

export default config;
