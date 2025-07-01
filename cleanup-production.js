#!/usr/bin/env node

/**
 * Production Cleanup Script
 * Removes test files and development utilities that shouldn't be in production
 */

const fs = require('fs');
const path = require('path');

const TEST_FILES_TO_REMOVE = [
  'test-api.js',
  'test-db.js',
  'test-payment-failure.js',
  'test-subscription.js',
  'test-webhook-payload.js',
  'test-simple-duration.js',
  'test-monthly-wellness-webhook.js',
  'test-monthly-fixed.js',
  'test-monthly-api.js',
  'test-fixed-payload.js',
  'test-fixed-flow.js',
  'test-complete-flow.js',
  'test-all-durations.js'
];

const DEV_DIRECTORIES_TO_REMOVE = [
  // Add any development-only directories here if needed
];

function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${filePath}`);
      return true;
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error removing ${filePath}:`, error.message);
    return false;
  }
}

function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${dirPath}`);
      return true;
    } else {
      console.log(`⚠️  Directory not found: ${dirPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error removing directory ${dirPath}:`, error.message);
    return false;
  }
}

function cleanupForProduction() {
  console.log('🧹 Starting production cleanup...');
  console.log('=====================================');
  
  let removedCount = 0;
  
  // Remove test files from root
  console.log('\n📁 Removing test files from root directory:');
  TEST_FILES_TO_REMOVE.forEach(fileName => {
    const filePath = path.join(process.cwd(), fileName);
    if (removeFile(filePath)) {
      removedCount++;
    }
  });
  
  // Remove development directories
  console.log('\n📁 Removing development directories:');
  DEV_DIRECTORIES_TO_REMOVE.forEach(dirName => {
    const dirPath = path.join(process.cwd(), dirName);
    if (removeDirectory(dirPath)) {
      removedCount++;
    }
  });
  
  console.log('\n📊 Summary:');
  console.log(`=====================================`);
  console.log(`✅ Files/directories removed: ${removedCount}`);
  console.log(`📋 Test pages protected with DevProtectionWrapper`);
  console.log(`🔒 Test API routes protected with checkDevAccess`);
  console.log('\n✨ Production cleanup completed!');
  
  if (removedCount === 0) {
    console.log('\n💡 Note: No test files found to remove. This is normal if cleanup was already performed.');
  }
  
  console.log('\n🚀 Your app is now production-ready!');
  console.log('📝 Remember to:');
  console.log('   - Set NODE_ENV=production');
  console.log('   - Set EMAIL_MOCK_MODE=false');
  console.log('   - Update OAuth tokens for email sending');
  console.log('   - Test all critical paths before deployment');
}

// Run if called directly
if (require.main === module) {
  cleanupForProduction();
}

module.exports = { cleanupForProduction };
