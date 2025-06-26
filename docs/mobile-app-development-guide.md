# Complete Mobile App Development Guide - Elixr Juice App

## Table of Contents
1. [Prerequisites & Environment Setup](#prerequisites--environment-setup)
2. [Project Preparation](#project-preparation)
3. [Android App Development](#android-app-development)
4. [iOS App Development](#ios-app-development)
5. [Building & Testing](#building--testing)
6. [App Store Deployment](#app-store-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites & Environment Setup

### 1. Install Required Software

#### For Windows Development:
```bash
# Install Node.js (already done)
# Install Android Studio
# Install Java Development Kit (JDK 17)
```

#### Required Downloads:
1. **Android Studio**: https://developer.android.com/studio
2. **JDK 17**: https://adoptium.net/temurin/releases/
3. **Xcode** (for iOS - Mac only): https://developer.apple.com/xcode/

### 2. Environment Variables Setup
Add these to your Windows Environment Variables:

```bash
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=C:\Users\%USERNAME%\AppData\Local\Android\Sdk

# Add to PATH:
%JAVA_HOME%\bin
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%ANDROID_HOME%\platform-tools
```

### 3. Verify Installation
```bash
java -version
android --version
```

---

## Project Preparation

### 1. Build Next.js for Static Export
```bash
cd "c:\Users\Anishbobby\Desktop\firebase-studio\studio"
npm run build
```

### 2. Initialize Capacitor (if not already done)
```bash
npx cap init "Elixr" "com.elixr.app"
```

### 3. Add Mobile Platforms
```bash
# Add Android platform
npx cap add android

# Add iOS platform (Mac only)
npx cap add ios
```

---

## Android App Development

### Step 1: Android Studio Setup

1. **Open Android Studio**
2. **Install Required Components**:
   - Go to SDK Manager
   - Install Android SDK Platform 34 (API Level 34)
   - Install Android SDK Build-Tools
   - Install Android Emulator
   - Install Intel x86 Emulator Accelerator (HAXM)

### Step 2: Configure Android Project

1. **Sync Capacitor with Android**:
```bash
cd "c:\Users\Anishbobby\Desktop\firebase-studio\studio"
npx cap sync android
```

2. **Open Android Project**:
```bash
npx cap open android
```

### Step 3: Android App Configuration

#### Update Android Manifest
File: `android/app/src/main/AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Internet permission for API calls -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <!-- Camera permission for potential future features -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- Storage permissions -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:exported="true"
            android:launchMode="singleTask"
            android:name="MainActivity"
            android:theme="@style/AppTheme.NoActionBarLaunch">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>
</manifest>
```

#### Update App Name and Version
File: `android/app/src/main/res/values/strings.xml`

```xml
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Elixr</string>
    <string name="title_activity_main">Elixr</string>
    <string name="package_name">com.elixr.app</string>
    <string name="custom_url_scheme">com.elixr.app</string>
</resources>
```

### Step 4: Create App Icons

1. **Generate Icons**: Use https://icon.kitchen/ or similar tool
2. **Icon Sizes Needed**:
   - 48x48 (mdpi)
   - 72x72 (hdpi)
   - 96x96 (xhdpi)
   - 144x144 (xxhdpi)
   - 192x192 (xxxhdpi)

3. **Place Icons** in `android/app/src/main/res/mipmap-*` folders

### Step 5: Build Android APK

#### Debug Build:
```bash
cd android
./gradlew assembleDebug
```

#### Release Build:
```bash
# Generate signing key first
keytool -genkey -v -keystore elixr-release-key.keystore -alias elixr -keyalg RSA -keysize 2048 -validity 10000

# Build release
./gradlew assembleRelease
```

#### Sign APK for Play Store:
```bash
# Create key.properties file in android folder
storeFile=elixr-release-key.keystore
keyAlias=elixr
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
```

---

## iOS App Development (Mac Required)

### Step 1: Xcode Setup

1. **Install Xcode** from App Store
2. **Install Xcode Command Line Tools**:
```bash
xcode-select --install
```

### Step 2: iOS Project Configuration

1. **Sync Capacitor with iOS**:
```bash
npx cap sync ios
```

2. **Open iOS Project**:
```bash
npx cap open ios
```

### Step 3: iOS App Configuration

#### Update Info.plist
Add these permissions in `ios/App/App/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app uses camera for taking photos</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app uses photo library to select images</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses location for delivery services</string>
```

#### Configure App Transport Security:
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

### Step 4: iOS Build Process

1. **Select Development Team** in Xcode project settings
2. **Update Bundle Identifier**: `com.elixr.app`
3. **Build for Device**:
   - Select your device or simulator
   - Click Product > Build
   - Click Product > Archive (for App Store)

---

## Building & Testing

### Development Workflow

1. **Make Changes to Next.js Code**
2. **Build Next.js**:
```bash
npm run build
```

3. **Sync with Capacitor**:
```bash
npx cap sync
```

4. **Test on Devices**:
```bash
# Android
npx cap run android

# iOS (Mac only)
npx cap run ios
```

### Live Reload Development

1. **Start Next.js Dev Server**:
```bash
npm run dev
```

2. **Update Capacitor Config** temporarily:
```typescript
// capacitor.config.ts
server: {
  hostname: 'localhost:3000',
  androidScheme: 'http',
  iosScheme: 'http',
}
```

3. **Sync and Run**:
```bash
npx cap sync
npx cap run android --livereload
```

---

## App Store Deployment

### Google Play Store (Android)

1. **Create Developer Account**: https://play.google.com/console
2. **Generate Signed APK**:
```bash
cd android
./gradlew bundleRelease  # Creates AAB file
```

3. **Upload to Play Console**:
   - Create new app
   - Upload AAB file
   - Fill app information
   - Submit for review

### Apple App Store (iOS)

1. **Create Apple Developer Account**: https://developer.apple.com
2. **Archive in Xcode**:
   - Product > Archive
   - Upload to App Store Connect

3. **App Store Connect**:
   - Create new app
   - Upload build
   - Fill app information
   - Submit for review

---

## Troubleshooting

### Common Android Issues

#### Gradle Build Fails:
```bash
cd android
./gradlew clean
./gradlew build
```

#### Clear Cache:
```bash
npx cap sync android --force
```

#### Java Version Issues:
```bash
# Check Java version
java -version
# Should be Java 17
```

### Common iOS Issues

#### Pod Install Fails:
```bash
cd ios/App
pod install --repo-update
```

#### Xcode Build Fails:
1. Clean Build Folder (⌘+Shift+K)
2. Reset Package Caches
3. Update iOS deployment target

### Network Issues

#### API Calls Failing:
1. Check CORS settings on your backend
2. Verify SSL certificates
3. Add domain to app's security exceptions

---

## Performance Optimization

### 1. Optimize Bundle Size
```bash
# Analyze bundle
npm run build
npx @next/bundle-analyzer
```

### 2. Image Optimization
- Use WebP format when possible
- Compress images before including
- Use appropriate sizes for different screen densities

### 3. Capacitor Plugins
Only include plugins you actually use:
```bash
npm uninstall @capacitor/plugin-name
npx cap sync
```

---

## Testing Strategy

### 1. Device Testing
- Test on real devices, not just emulators
- Test different screen sizes
- Test different Android/iOS versions

### 2. Performance Testing
- Monitor app startup time
- Check memory usage
- Test offline functionality

### 3. User Experience Testing
- Test touch interactions
- Verify keyboard behavior
- Check navigation flows

---

## Maintenance & Updates

### Regular Updates:
```bash
# Update Capacitor
npm update @capacitor/core @capacitor/cli
npx cap sync

# Update platforms
npx cap update android
npx cap update ios
```

### Monitoring:
- Set up crash reporting (Firebase Crashlytics)
- Monitor app performance
- Track user analytics

This guide covers the complete process from development to deployment. Let me know if you need clarification on any specific step!
