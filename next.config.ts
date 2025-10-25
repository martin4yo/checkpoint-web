import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs', '@vladmandic/face-api'],
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '149.50.148.198',
      },
      {
        protocol: 'http',
        hostname: '149.50.148.198',
        port: '8086',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
