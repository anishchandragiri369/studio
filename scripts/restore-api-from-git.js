const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');

// Get all API route files that need to be restored
function getApiRouteFiles() {
  const result = execSync('git ls-files src/app/api/**/route.ts', { encoding: 'utf8' });
  return result.trim().split('\n').filter(file => file.length > 0);
}

// Restore API routes from git commit before they were patched
function restoreApiRoutesFromGit() {
  console.log('🔄 Restoring API routes from git history...');
  
  const commitHash = '429e64e'; // Commit before API routes were patched
  const apiFiles = getApiRouteFiles();
  
  let restoredCount = 0;
  
  for (const file of apiFiles) {
    try {
      // Get the original content from git
      const originalContent = execSync(`git show ${commitHash}:${file}`, { encoding: 'utf8' });
      
      // Write the original content back
      const fullPath = path.join(__dirname, '..', file);
      const dir = path.dirname(fullPath);
      
      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, originalContent);
      restoredCount++;
      console.log(`✅ Restored: ${file}`);
    } catch (error) {
      // If file doesn't exist in that commit, skip it
      console.log(`⚠️  Skipped: ${file} (not found in commit ${commitHash})`);
    }
  }
  
  console.log(`🎉 Restored ${restoredCount} API route files from git history`);
}

restoreApiRoutesFromGit();
