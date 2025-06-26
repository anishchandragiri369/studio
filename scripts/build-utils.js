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
  
  for (const routeFile of routeFiles) {
    const relativePath = path.relative(API_DIR, routeFile);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    const backupDir = path.dirname(backupPath);
    
    // Create backup directory structure
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy original file to backup
    fs.copyFileSync(routeFile, backupPath);
  }
  
  console.log(`✅ Backed up ${routeFiles.length} API route files`);
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

  for (const routeFile of routeFiles) {
    fs.writeFileSync(routeFile, placeholder);
  }
  
  console.log(`✅ Replaced ${routeFiles.length} API route files with placeholders`);
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
    
    // Restore original file
    fs.copyFileSync(backupFile, originalPath);
  }
  
  console.log(`✅ Restored ${backupFiles.length} API route files`);
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
      backupApiRoutes();
      replaceWithPlaceholders();
      break;
    case 'restore':
      restoreApiRoutes();
      break;
    case 'cleanup':
      cleanupBackup();
      break;
    default:
      console.log('Usage: node build-utils.js [backup|prepare-static|restore|cleanup]');
      console.log('');
      console.log('Commands:');
      console.log('  backup         - Backup original API routes');
      console.log('  prepare-static - Backup and replace API routes with placeholders');
      console.log('  restore        - Restore original API routes from backup');
      console.log('  cleanup        - Remove backup directory');
  }
}

main();
