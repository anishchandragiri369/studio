#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get API base URL from command line argument or use default
const apiBaseUrl = process.argv[2] || 'https://develixr.netlify.app';

console.log('🚀 Building APK with API Base URL:', apiBaseUrl);

// Create temporary .env.local file with correct API URL
const envContent = `NEXT_PUBLIC_API_BASE_URL=${apiBaseUrl}
NEXT_PUBLIC_BUILD_MODE=static
MOBILE_BUILD=true
`;

fs.writeFileSync('.env.local', envContent);
console.log('✅ Created .env.local with mobile configuration');

try {
  // Run the mobile build process
  console.log('📦 Building static export...');
  execSync('npm run build:static', { stdio: 'inherit' });
  
  console.log('🔄 Syncing with Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  console.log('🏗️  Opening Android Studio...');
  execSync('npx cap open android', { stdio: 'inherit' });
  
  console.log('');
  console.log('🎉 APK build process started!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Android Studio should open automatically');
  console.log('2. Go to Build > Build Bundle(s) / APK(s) > Build APK(s)');
  console.log('3. APK will be generated at: android/app/build/outputs/apk/debug/app-debug.apk');
  console.log('');
  console.log(`📡 Your app will connect to: ${apiBaseUrl}`);
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Clean up temporary .env.local file
  if (fs.existsSync('.env.local')) {
    fs.unlinkSync('.env.local');
    console.log('🧹 Cleaned up temporary .env.local');
  }
}
