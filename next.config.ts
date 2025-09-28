import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    domains: ['localhost', '149.50.148.198'],
    remotePatterns: [
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
