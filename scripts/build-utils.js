const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');
const BACKUP_DIR = path.join(__dirname, '../.api-backup');

// Create backup directory if it doesn't exist
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Recursively get all route.ts files
function getAllRouteFiles(dir, routes = []) {
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

// Backup original API routes
function backupApiRoutes() {
  console.log('📦 Backing up API routes...');
  ensureBackupDir();
  
  const routeFiles = getAllRouteFiles(API_DIR);
  let backedUpCount = 0;
  
  for (const routeFile of routeFiles) {
    const relativePath = path.relative(API_DIR, routeFile);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    const backupDir = path.dirname(backupPath);
    
    // Check if the file contains real code (not a placeholder)
    const content = fs.readFileSync(routeFile, 'utf8');
    const isPlaceholder = content.includes('export {};') && content.includes('placeholder for static export');
    
    if (isPlaceholder) {
      console.log(`⚠️  Skipping placeholder file: ${relativePath}`);
      continue;
    }
    
    // Create backup directory structure
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy original file to backup
    fs.copyFileSync(routeFile, backupPath);
    backedUpCount++;
  }
  
  console.log(`✅ Backed up ${backedUpCount} API route files with real code`);
}

// Replace API routes with static export placeholders
function replaceWithPlaceholders() {
  console.log('🔄 Replacing API routes with static export placeholders...');
  
  const routeFiles = getAllRouteFiles(API_DIR);
  const placeholder = `// This file is a placeholder for static export compatibility.
// Next.js static export does not support API routes.
// No exports: this prevents build errors for static export.
export {};
`;

  let replacedCount = 0;
  let removedCount = 0;

  for (const routeFile of routeFiles) {
    // Check if this is a dynamic route (contains [])
    if (routeFile.includes('[') && routeFile.includes(']')) {
      // For dynamic routes, remove the directory entirely to avoid static export issues
      const routeDir = path.dirname(routeFile);
      if (fs.existsSync(routeDir)) {
        fs.rmSync(routeDir, { recursive: true, force: true });
        removedCount++;
        console.log(`🗑️  Removed dynamic route: ${path.relative(API_DIR, routeDir)}`);
      }
    } else {
      // For non-dynamic routes, replace with placeholder
      fs.writeFileSync(routeFile, placeholder);
      replacedCount++;
    }
  }
  
  console.log(`✅ Replaced ${replacedCount} static API routes with placeholders`);
  console.log(`✅ Removed ${removedCount} dynamic API routes for static export`);
}

// Restore original API routes from backup
function restoreApiRoutes() {
  console.log('🔄 Restoring original API routes...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('⚠️  No backup found. API routes may already be restored.');
    return;
  }
  
  const backupFiles = getAllRouteFiles(BACKUP_DIR);
  
  for (const backupFile of backupFiles) {
    const relativePath = path.relative(BACKUP_DIR, backupFile);
    const originalPath = path.join(API_DIR, relativePath);
    const originalDir = path.dirname(originalPath);
    
    // Create directory structure if it doesn't exist (for dynamic routes that were removed)
    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true });
    }
    
    // Restore original file
    fs.copyFileSync(backupFile, originalPath);
  }
  
  console.log(`✅ Restored ${backupFiles.length} API route files`);
}

// Ensure we have a good backup with real code (not placeholders)
function ensureGoodBackup() {
  console.log('🔍 Checking backup quality...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('📦 No backup found, creating fresh backup...');
    backupApiRoutes();
    return;
  }
  
  const backupFiles = getAllRouteFiles(BACKUP_DIR);
  let hasValidBackup = false;
  
  for (const backupFile of backupFiles) {
    const content = fs.readFileSync(backupFile, 'utf8');
    const isPlaceholder = content.includes('export {};') && content.includes('placeholder for static export');
    
    if (!isPlaceholder && content.trim().length > 100) {
      hasValidBackup = true;
      break;
    }
  }
  
  if (!hasValidBackup) {
    console.log('⚠️  Backup contains placeholders, refreshing from current API files...');
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    backupApiRoutes();
  } else {
    console.log('✅ Good backup found');
  }
}

// Clean up backup directory
function cleanupBackup() {
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true });
    console.log('🧹 Cleaned up backup directory');
  }
}

// Main function
function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      backupApiRoutes();
      break;
    case 'prepare-static':
      ensureGoodBackup();
      replaceWithPlaceholders();
      break;
    case 'restore':
      restoreApiRoutes();
      break;
    case 'cleanup':
      cleanupBackup();
      break;
    case 'ensure-backup':
      ensureGoodBackup();
      break;
    default:
      console.log('Usage: node build-utils.js [backup|prepare-static|restore|cleanup|ensure-backup]');
      console.log('');
      console.log('Commands:');
      console.log('  backup         - Backup original API routes');
      console.log('  prepare-static - Ensure good backup and replace API routes with placeholders');
      console.log('  restore        - Restore original API routes from backup');
      console.log('  cleanup        - Remove backup directory');
      console.log('  ensure-backup  - Ensure we have a good backup of real API code');
  }
}

main();
