// Custom image loader for static export and mobile builds
export default function imageLoader({ src, width, quality }: { src: string; width?: number; quality?: number }) {
  // Check if we're in a mobile/Capacitor environment
  const isMobile = typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' || 
    window.location.protocol === 'ionic:' ||
    window.location.hostname === 'localhost'
  );
  
  // For mobile/APK builds, use local assets
  if (isMobile || process.env.NEXT_PUBLIC_BUILD_MODE === 'static') {
    // If src is already a full URL, return it as-is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // For local assets, return the path as-is (images are bundled in the APK)
    return src;
  }
  
  // For web builds, use the API base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  
  // If src is already a full URL, return it as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // If src starts with /, it's a relative path from the root
  if (src.startsWith('/')) {
    return `${baseUrl}${src}`;
  }
  
  // Otherwise, treat as a relative path
  return `${baseUrl}/${src}`;
}
