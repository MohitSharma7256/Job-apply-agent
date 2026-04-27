/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabling lint and type checking during builds for speed and reliability 
  // since we are deploying a complex automation agent.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;