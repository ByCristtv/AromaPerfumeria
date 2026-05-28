import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "https://pavement-exuberant-harness.ngrok-free.dev",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xabzbvanmqeplenfoozx.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      
    ],
  },
};

export default nextConfig;
