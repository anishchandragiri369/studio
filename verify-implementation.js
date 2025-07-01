#!/usr/bin/env node

/**
 * Simple verification script for admin pause system files
 * Checks if all files are properly created and have expected content
 */

const fs = require('fs');
const path = require('path');

// Color coding
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, message) {
    console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
    log(colors.green, `✓ ${message}`);
}

function error(message) {
    log(colors.red, `✗ ${message}`);
}

function info(message) {
    log(colors.blue, `ℹ ${message}`);
}

function section(title) {
    log(colors.bold + colors.blue, `\n=== ${title} ===`);
}

// Check if file exists and contains expected content
function checkFile(filePath, expectedContent = []) {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
        error(`File not found: ${filePath}`);
        return false;
    }
    
    success(`File exists: ${filePath}`);
    
    if (expectedContent.length > 0) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        for (const expected of expectedContent) {
            if (content.includes(expected)) {
                success(`  Contains: ${expected}`);
            } else {
                error(`  Missing: ${expected}`);
            }
        }
    }
    
    return true;
}

function verifyImplementation() {
    log(colors.bold + colors.blue, 'Verifying Admin Pause System Implementation\n');
    
    // Core files to check
    const coreFiles = [
        {
            path: 'src/lib/adminPauseHelper.ts',
            content: ['checkAdminPauseStatus', 'isUserAdminPaused']
        },
        {
            path: 'src/app/api/admin/pause-status/route.ts',
            content: ['GET', 'admin_subscription_pauses']
        },
        {
            path: 'src/app/api/admin/subscriptions/pause/route.ts',
            content: ['POST', 'admin_subscription_pauses', 'admin_audit_logs']
        },
        {
            path: 'src/app/api/admin/subscriptions/reactivate/route.ts',
            content: ['POST', 'reactivated', 'admin_audit_logs']
        },
        {
            path: 'src/app/api/admin/subscriptions/overview/route.ts',
            content: ['GET', 'get_admin_pause_summary']
        },
        {
            path: 'src/app/api/admin/test-delivery-logic/route.ts',
            content: ['getNextDeliveryDate', 'delivery scheduling test']
        },
        {
            path: 'src/app/admin/subscriptions/page.tsx',
            content: ['AdminSubscriptionManagement', 'admin pause']
        },
        {
            path: 'src/components/admin/AdminPauseNotification.tsx',
            content: ['AdminPauseNotification', 'admin pause is currently active']
        },
        {
            path: 'sql/admin_subscription_pause_system.sql',
            content: ['admin_subscription_pauses', 'admin_audit_logs', 'cleanup_expired_admin_pauses']
        }
    ];
    
    // Updated files to check
    const updatedFiles = [
        {
            path: 'src/app/api/cron/delivery-scheduler/route.ts',
            content: ['cleanup_expired_admin_pauses', 'admin_paused']
        },
        {
            path: 'src/app/api/subscriptions/create/route.ts',
            content: ['checkAdminPauseStatus', 'temporarily paused']
        },
        {
            path: 'src/app/api/subscriptions/pause/route.ts',
            content: ['checkAdminPauseStatus', 'admin pause']
        },
        {
            path: 'src/app/api/fruit-bowls/subscriptions/route.ts',
            content: ['checkAdminPauseStatus', 'temporarily paused']
        },
        {
            path: 'src/components/subscriptions/SubscriptionCard.tsx',
            content: ['admin_paused', 'AdminPauseNotification']
        },
        {
            path: 'src/app/admin/page.tsx',
            content: ['Subscription Management', '/admin/subscriptions']
        },
        {
            path: 'src/lib/types.ts',
            content: ['admin_pause_id', 'admin_paused']
        }
    ];
    
    section('Checking Core Implementation Files');
    let corePass = 0;
    for (const file of coreFiles) {
        if (checkFile(file.path, file.content)) {
            corePass++;
        }
    }
    
    section('Checking Updated Integration Files');
    let updatePass = 0;
    for (const file of updatedFiles) {
        if (checkFile(file.path, file.content)) {
            updatePass++;
        }
    }
    
    // Summary
    section('Implementation Summary');
    success(`Core files: ${corePass}/${coreFiles.length}`);
    success(`Updated files: ${updatePass}/${updatedFiles.length}`);
    
    const totalFiles = coreFiles.length + updatedFiles.length;
    const totalPass = corePass + updatePass;
    
    if (totalPass === totalFiles) {
        success(`All ${totalFiles} files verified successfully!`);
    } else {
        error(`${totalFiles - totalPass} files have issues`);
    }
    
    // Next steps
    section('Next Steps');
    info('1. Run the SQL migration in Supabase:');
    info('   - Copy sql/admin_subscription_pause_system.sql');
    info('   - Paste in Supabase SQL Editor');
    info('   - Execute to create tables and functions');
    info('');
    info('2. Start the development server:');
    info('   npm run dev');
    info('');
    info('3. Test the admin interface:');
    info('   - Navigate to http://localhost:3000/admin');
    info('   - Click "Subscription Management"');
    info('   - Test pause/reactivate functionality');
    info('');
    info('4. Verify delivery scheduling:');
    info('   - Visit http://localhost:3000/api/admin/test-delivery-logic');
    info('   - Check that dates exclude Sundays and maintain gaps');
    info('');
    info('5. Test user flows:');
    info('   - Create admin pause');
    info('   - Try creating subscription (should be blocked)');
    info('   - Reactivate and verify normal operation');
    
    return totalPass === totalFiles;
}

// Run verification
if (require.main === module) {
    const success = verifyImplementation();
    process.exit(success ? 0 : 1);
}

module.exports = { verifyImplementation, checkFile };
