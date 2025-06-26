
import type {NextConfig} from 'next';

// Detect build mode from environment
const isMobileBuild = process.env.MOBILE_BUILD === 'true' || process.env.BUILD_TARGET === 'mobile';
const isStaticExport = isMobileBuild || process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  /* config options here */
  // Conditionally enable static export for mobile builds
  ...(isStaticExport && { output: 'export' }),
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
    // Only use custom loader for static export builds
    ...(isStaticExport && {
      loader: 'custom',
      loaderFile: './src/lib/imageLoader.ts',
    }),
  },
};

export default nextConfig;
