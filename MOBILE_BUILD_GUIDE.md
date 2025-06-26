# Static APK Build Instructions

## Prerequisites
Make sure you have Android Studio and the Android SDK installed.

## Build APK Locally

### 1. Generate Static Build
```bash
npm run build:static
```

### 2. Sync with Capacitor
```bash
npm run cap:sync
```

### 3. Open in Android Studio
```bash
npm run cap:open:android
```

### 4. Build APK in Android Studio
1. In Android Studio, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
2. Wait for the build to complete
3. Click **"locate"** to find your APK file
4. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Install APK on Device
```bash
# Via ADB (if device connected)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or manually transfer the APK file to your device and install
```

## Quick Commands

```bash
# Complete mobile build process
npm run mobile:build

# Build and run on connected Android device
npm run mobile:dev:android

# Build APK (combines everything above)
npm run mobile:apk
```

## Environment Variables for Static Build

The following environment variables are automatically set when using `npm run build:static`:

```env
MOBILE_BUILD=true
NEXT_PUBLIC_BUILD_MODE=static
NEXT_PUBLIC_API_BASE_URL=https://your-deployed-server.com
```

Make sure `NEXT_PUBLIC_API_BASE_URL` points to your Netlify deployment URL so the mobile app can access your APIs.
