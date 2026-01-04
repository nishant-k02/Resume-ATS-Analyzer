import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Increase timeout for API routes on AWS Amplify
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
