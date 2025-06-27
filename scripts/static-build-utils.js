const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');
const PLACEHOLDER_DIR = path.join(__dirname, '../.api-placeholders');
const TEMP_API_DIR = path.join(__dirname, '../.temp-api-backup');

const PLACEHOLDER_CONTENT = `// This file is a placeholder for static export compatibility.
// Next.js static export does not support API routes.
// No exports: this prevents build errors for static export.
export {};
`;

// Recursively get all route.ts files
function getAllRouteFiles(dir, routes = []) {
  if (!fs.existsSync(dir)) return routes;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      getAllRouteFiles(fullPath, routes);
    } else if (item === 'route.ts') {
      routes.push(fullPath);
    }
  }
  
  return routes;
}

// Create placeholder files that mirror the API structure
function createPlaceholders() {
  console.log('📦 Creating API placeholder files...');
  
  // Remove existing placeholder directory
  if (fs.existsSync(PLACEHOLDER_DIR)) {
    fs.rmSync(PLACEHOLDER_DIR, { recursive: true, force: true });
  }
  
  // Create placeholder directory
  fs.mkdirSync(PLACEHOLDER_DIR, { recursive: true });
  
  const routeFiles = getAllRouteFiles(API_DIR);
  let createdCount = 0;
  
  for (const routeFile of routeFiles) {
    const relativePath = path.relative(API_DIR, routeFile);
    const placeholderPath = path.join(PLACEHOLDER_DIR, relativePath);
    const placeholderDir = path.dirname(placeholderPath);
    
    // Skip dynamic routes for static export
    if (relativePath.includes('[') && relativePath.includes(']')) {
      console.log(`⏭️  Skipping dynamic route: ${relativePath}`);
      continue;
    }
    
    // Create placeholder directory structure
    if (!fs.existsSync(placeholderDir)) {
      fs.mkdirSync(placeholderDir, { recursive: true });
    }
    
    // Create placeholder file
    fs.writeFileSync(placeholderPath, PLACEHOLDER_CONTENT);
    createdCount++;
  }
  
  console.log(`✅ Created ${createdCount} placeholder API files`);
}

// Copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Replace API directory with placeholders for static build
function usePlaceholders() {
  console.log('🔄 Switching to placeholder API files for static build...');
  
  // Backup the real API directory
  if (fs.existsSync(TEMP_API_DIR)) {
    fs.rmSync(TEMP_API_DIR, { recursive: true, force: true });
  }
  copyDirectory(API_DIR, TEMP_API_DIR);
  
  // Remove original API directory
  fs.rmSync(API_DIR, { recursive: true, force: true });
  
  // Copy placeholder directory to API location
  copyDirectory(PLACEHOLDER_DIR, API_DIR);
  
  console.log('✅ Switched to placeholder API files');
}

// Restore original API directory after static build
function restoreOriginalApi() {
  console.log('🔄 Restoring original API files...');
  
  // Remove placeholder directory (now at API_DIR location)
  if (fs.existsSync(API_DIR)) {
    fs.rmSync(API_DIR, { recursive: true, force: true });
  }
  
  // Restore original API directory
  copyDirectory(TEMP_API_DIR, API_DIR);
  
  // Clean up temp backup
  if (fs.existsSync(TEMP_API_DIR)) {
    fs.rmSync(TEMP_API_DIR, { recursive: true, force: true });
  }
  
  console.log('✅ Restored original API files');
}

// Clean up temporary files
function cleanup() {
  console.log('🧹 Cleaning up temporary files...');
  
  if (fs.existsSync(TEMP_API_DIR)) {
    fs.rmSync(TEMP_API_DIR, { recursive: true, force: true });
  }
  
  if (fs.existsSync(PLACEHOLDER_DIR)) {
    fs.rmSync(PLACEHOLDER_DIR, { recursive: true, force: true });
  }
  
  console.log('✅ Cleanup completed');
}

// Main function
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'create-placeholders':
      createPlaceholders();
      break;
    case 'use-placeholders':
      usePlaceholders();
      break;
    case 'restore-api':
      restoreOriginalApi();
      break;
    case 'cleanup':
      cleanup();
      break;
    default:
      console.log('Usage: node static-build-utils.js [create-placeholders|use-placeholders|restore-api|cleanup]');
      console.log('');
      console.log('Commands:');
      console.log('  create-placeholders - Create placeholder API files for static export');
      console.log('  use-placeholders    - Switch to placeholder API files for static build');
      console.log('  restore-api         - Restore original API files after static build');
      console.log('  cleanup             - Remove all temporary files');
  }
}

main();
