# Dual-Mode Development Guide

This project now supports both **server mode** (traditional Next.js with API routes) and **static export mode** (for mobile/APK builds) from the same codebase.

## Build Modes

### Server Mode (Default)
- Traditional Next.js with API routes
- For web deployment to Netlify, Vercel, etc.
- Supports all Next.js features

### Static Export Mode
- Static HTML/CSS/JS export
- For mobile apps via Capacitor
- No server-side features (API routes, Server Actions)

## Scripts

### Development
```bash
npm run dev                 # Development server (localhost:9002)
```

### Server Builds
```bash
npm run build              # Default build (server mode)
npm run build:server       # Explicit server build
npm start                  # Start production server
```

### Static/Mobile Builds
```bash
npm run build:static       # Static export build
npm run mobile:build       # Build + sync with Capacitor
npm run mobile:apk         # Build + generate APK
```

### Capacitor Commands
```bash
npm run cap:sync           # Sync with Capacitor (after build:static)
npm run cap:open:android   # Open Android Studio
npm run cap:open:ios       # Open Xcode
npm run mobile:dev:android # Live reload on Android device
npm run mobile:dev:ios     # Live reload on iOS device
```

## Environment Configuration

The project automatically switches between modes based on environment variables:

### Server Mode (default)
```env
NEXT_PUBLIC_BUILD_MODE=server
NEXT_PUBLIC_API_BASE_URL=https://your-server.com
```

### Static Mode (set via scripts)
```env
MOBILE_BUILD=true
NEXT_PUBLIC_BUILD_MODE=static
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
```

## API Calls

Use the provided utilities for environment-aware API calls:

```typescript
import { apiGet, apiPost, createApiUrl } from '@/lib/apiUtils';

// Automatically uses correct base URL for current mode
const data = await apiGet('/api/users');
const result = await apiPost('/api/orders', orderData);

// Manual URL creation
const url = createApiUrl('/api/endpoint');
```

## Images

Images are handled automatically:
- **Server mode**: Uses Next.js optimized images
- **Static mode**: Uses custom loader with base URL

```typescript
import Image from 'next/image';

// Works in both modes
<Image src="/images/logo.png" width={100} height={100} alt="Logo" />
```

## File Structure

### Available in Both Modes
- All frontend pages and components
- Client-side logic and hooks
- Static assets (images, fonts, etc.)

### Server Mode Only
- API routes (`src/app/api/`)
- Server Actions
- Server-side rendering features

### Replaced in Static Mode
- API routes → Empty placeholder files
- Server Actions → Client-side alternatives
- AI flows → Static placeholder implementations

## Troubleshooting

### Build Errors
1. **API route errors**: Ensure all API routes are patched with `export {};`
2. **Server Action errors**: Remove `'use server'` and implement client-side alternatives
3. **Dynamic import errors**: Check that all imports work in static mode

### Testing Both Modes
1. Test server mode: `npm run build:server && npm start`
2. Test static mode: `npm run build:static` (check `out/` folder)
3. Test mobile: `npm run mobile:build` then test APK

### Common Issues
- **Images not loading**: Check `NEXT_PUBLIC_API_BASE_URL` is set correctly
- **API calls failing**: Ensure API server is running and accessible
- **Build fails**: Check for remaining Server Actions or unsupported features

## Development Workflow

1. **Develop normally**: Use `npm run dev` for regular development
2. **Test server mode**: `npm run build:server` before deploying to web
3. **Test mobile mode**: `npm run build:static` before building APK
4. **Deploy**: 
   - Web: Use server build
   - Mobile: Use static build with Capacitor

## Environment Variables

Make sure these are set correctly:

```env
# Core API configuration
NEXT_PUBLIC_API_BASE_URL=https://your-production-server.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# Google Maps (for mobile)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key

# Payment (Cashfree)
CASHFREE_APP_ID=your-app-id
CASHFREE_SECRET_KEY=your-secret-key
```

This dual-mode setup allows you to maintain a single codebase for both web and mobile deployments!
