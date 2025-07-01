import type { NextConfig } from 'next';

// Mobile build configuration - excludes API routes for static export
const mobileConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
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
    ],
    unoptimized: true,
  },
  // Exclude API routes from static export
  exportPathMap: async function (defaultPathMap) {
    // Remove all API routes from the export
    const pathMap = { ...defaultPathMap };
    
    // Remove API routes
    Object.keys(pathMap).forEach(key => {
      if (key.startsWith('/api/')) {
        delete pathMap[key];
      }
    });
    
    return pathMap;
  },
};

export default mobileConfig;
