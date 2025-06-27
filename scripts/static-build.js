const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');
const PLACEHOLDER_DIR = path.join(__dirname, '../.api-placeholders');
const BACKUP_API_DIR = path.join(__dirname, '../.api-original-backup');

// Move original API files to backup and replace with placeholders
function prepareForStaticBuild() {
  console.log('🔄 Preparing for static build - backing up original APIs and using placeholders...');
  
  // Remove any existing backup
  if (fs.existsSync(BACKUP_API_DIR)) {
    fs.rmSync(BACKUP_API_DIR, { recursive: true, force: true });
  }
  
  // Copy original API directory to backup first
  if (fs.existsSync(API_DIR)) {
    copyDirectory(API_DIR, BACKUP_API_DIR);
    console.log('✅ Backed up original API files');
    
    // Remove original API directory
    fs.rmSync(API_DIR, { recursive: true, force: true });
    console.log('✅ Removed original API directory');
  }
  
  // Copy placeholder APIs to the API directory
  copyDirectory(PLACEHOLDER_DIR, API_DIR);
  console.log('✅ Replaced API directory with placeholders');
}

// Restore original API files
function restoreAfterStaticBuild() {
  console.log('🔄 Restoring original API files...');
  
  // Remove placeholder API directory
  if (fs.existsSync(API_DIR)) {
    fs.rmSync(API_DIR, { recursive: true, force: true });
    console.log('✅ Removed placeholder API directory');
  }
  
  // Copy backup back to original location
  if (fs.existsSync(BACKUP_API_DIR)) {
    copyDirectory(BACKUP_API_DIR, API_DIR);
    console.log('✅ Restored original API files');
    
    // Clean up backup
    fs.rmSync(BACKUP_API_DIR, { recursive: true, force: true });
    console.log('✅ Cleaned up backup directory');
  } else {
    console.error('❌ No backup found to restore!');
  }
}

// Helper function to copy directories recursively
function copyDirectory(src, dest) {
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

// Main function
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'prepare':
      prepareForStaticBuild();
      break;
    case 'restore':
      restoreAfterStaticBuild();
      break;
    default:
      console.log('Usage: node static-build.js [prepare|restore]');
      console.log('');
      console.log('Commands:');
      console.log('  prepare  - Backup original APIs and use placeholders');
      console.log('  restore  - Restore original API files');
  }
}

main();
