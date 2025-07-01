#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate build timestamp for cache busting
const buildTime = new Date().toISOString();
const version = `${Date.now()}`;

// Create or update .env.local with build info
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';

// Read existing .env.local if it exists
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Remove existing build-related variables
envContent = envContent
  .split('\n')
  .filter(line => !line.startsWith('NEXT_PUBLIC_BUILD_TIME=') && !line.startsWith('NEXT_PUBLIC_APP_VERSION='))
  .join('\n');

// Add new build info
if (envContent && !envContent.endsWith('\n')) {
  envContent += '\n';
}

envContent += `NEXT_PUBLIC_BUILD_TIME=${buildTime}\n`;
envContent += `NEXT_PUBLIC_APP_VERSION=${version}\n`;

// Write back to .env.local
fs.writeFileSync(envPath, envContent);

console.log(`✅ Build version set to: ${version}`);
console.log(`✅ Build time set to: ${buildTime}`);
console.log('🔄 This will force cache invalidation on client browsers');
