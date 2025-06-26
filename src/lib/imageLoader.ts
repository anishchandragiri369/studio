// Custom image loader for static export and mobile builds
export default function imageLoader({ src, width, quality }: { src: string; width?: number; quality?: number }) {
  // For static export, return the src as-is
  // In mobile builds, images should be loaded from the server
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
