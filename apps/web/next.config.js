/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  images: {
  unoptimized: true,
  },
};

module.exports = nextConfig;
