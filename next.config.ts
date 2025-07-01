
import type {NextConfig} from 'next';

// Simple, explicit build mode detection - ONLY enable export for mobile builds
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig: NextConfig = {
  // Only set output export if explicitly building for mobile
  ...(isMobileBuild ? { output: 'export' } : {}),
  
  // Explicitly exclude mobile directory from webpack compilation
  webpack: (config, { dev, isServer }) => {
    // Ignore mobile directory entirely
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
        '**/mobile/**',
        '**/node_modules/**'
      ]
    };
    
    return config;
  },
  
  // Add selective cache control headers to prevent auth caching issues
  headers: async () => {
    return [
      {
        // Only apply no-cache to auth-related pages
        source: '/(login|signup|reset-password|logout)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
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
