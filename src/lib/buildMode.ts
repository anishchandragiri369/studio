// Build mode detection utility
export const getBuildMode = () => {
  // Check if we're in a static export build (mobile/APK)
  const isMobileBuild = process.env.MOBILE_BUILD === 'true' || 
                       process.env.BUILD_TARGET === 'mobile' ||
                       process.env.STATIC_EXPORT === 'true';
  
  // Check if we're in a client-side static export environment
  const isStaticRuntime = typeof window !== 'undefined' && 
                         !window.location.origin.includes('localhost') &&
                         process.env.NEXT_PUBLIC_BUILD_MODE === 'static';

  return {
    isMobileBuild,
    isStaticRuntime,
    isServerSide: !isMobileBuild && !isStaticRuntime,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  };
};

// Helper to get the correct API URL based on build mode
export const getApiUrl = (endpoint: string) => {
  const { isServerSide, apiBaseUrl } = getBuildMode();
  
  // In server-side mode, use relative URLs
  if (isServerSide && typeof window === 'undefined') {
    return endpoint;
  }
  
  // In static/mobile builds, use the full API base URL
  return `${apiBaseUrl}${endpoint}`;
};
