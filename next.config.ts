
import type {NextConfig} from 'next';

// Simple, explicit build mode detection - ONLY enable export for mobile builds
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig: NextConfig = {
  // Only set output export if explicitly building for mobile
  ...(isMobileBuild ? { output: 'export' } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
    // Only use custom loader for mobile builds
    ...(isMobileBuild ? {
      loader: 'custom',
      loaderFile: './src/lib/imageLoader.ts',
    } : {}),
  },
};

export default nextConfig;
