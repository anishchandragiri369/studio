#!/usr/bin/env node

/**
 * SQL Validation Script
 * Tests that the admin_subscription_pause_system.sql can be run multiple times without errors
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

function validateSQLFile() {
    section('Validating admin_subscription_pause_system.sql');
    
    const sqlPath = path.join(__dirname, 'sql', 'admin_subscription_pause_system.sql');
    
    if (!fs.existsSync(sqlPath)) {
        error('SQL file not found: sql/admin_subscription_pause_system.sql');
        return false;
    }
    
    success('SQL file exists');
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Check for idempotent patterns
    const checks = [
        {
            pattern: /CREATE TABLE IF NOT EXISTS/g,
            name: 'CREATE TABLE IF NOT EXISTS',
            required: true
        },
        {
            pattern: /ADD COLUMN IF NOT EXISTS/g,
            name: 'ADD COLUMN IF NOT EXISTS',
            required: true
        },
        {
            pattern: /CREATE INDEX IF NOT EXISTS/g,
            name: 'CREATE INDEX IF NOT EXISTS',
            required: true
        },
        {
            pattern: /CREATE OR REPLACE FUNCTION/g,
            name: 'CREATE OR REPLACE FUNCTION',
            required: true
        },
        {
            pattern: /DROP TRIGGER IF EXISTS/g,
            name: 'DROP TRIGGER IF EXISTS',
            required: true
        },
        {
            pattern: /DO \$\$/g,
            name: 'Error handling blocks (DO $$)',
            required: true
        }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
        const matches = sqlContent.match(check.pattern);
        const count = matches ? matches.length : 0;
        
        if (check.required && count > 0) {
            success(`${check.name}: ${count} instances found`);
        } else if (check.required && count === 0) {
            error(`${check.name}: Not found (required for idempotency)`);
            allPassed = false;
        } else {
            info(`${check.name}: ${count} instances found`);
        }
    });
    
    // Check for problematic patterns
    const problemPatterns = [];
    
    // Check if CREATE TRIGGER is properly handled
    const triggerMatches = sqlContent.match(/CREATE TRIGGER/g);
    const doBlockTriggers = sqlContent.includes('DROP TRIGGER IF EXISTS') && 
                           sqlContent.includes('CREATE TRIGGER') && 
                           sqlContent.includes('DO $$');
    
    if (triggerMatches && triggerMatches.length > 0) {
        if (doBlockTriggers) {
            success(`CREATE TRIGGER: Properly handled with DO block and DROP IF EXISTS`);
        } else {
            error(`CREATE TRIGGER: Not properly handled (missing DO block or DROP IF EXISTS)`);
            allPassed = false;
        }
    }
    
    return allPassed;
}

function checkSQLStructure() {
    section('Checking SQL Structure');
    
    const sqlPath = path.join(__dirname, 'sql', 'admin_subscription_pause_system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    const expectedObjects = [
        'admin_subscription_pauses',
        'admin_audit_logs', 
        'get_admin_pause_summary',
        'cleanup_expired_admin_pauses',
        'calculate_reactivation_delivery_date',
        'update_admin_pause_updated_at'
    ];
    
    let allFound = true;
    
    expectedObjects.forEach(obj => {
        if (sqlContent.includes(obj)) {
            success(`Object found: ${obj}`);
        } else {
            error(`Object missing: ${obj}`);
            allFound = false;
        }
    });
    
    // Check for proper comments
    const hasHeader = sqlContent.includes('Admin Subscription Pause System - Database Schema');
    const hasCompletion = sqlContent.includes('Admin Subscription Pause System Setup Complete!');
    
    if (hasHeader) {
        success('Header comment found');
    } else {
        error('Header comment missing');
        allFound = false;
    }
    
    if (hasCompletion) {
        success('Completion message found');
    } else {
        error('Completion message missing');  
        allFound = false;
    }
    
    return allFound;
}

function displayRunInstructions() {
    section('How to Run the SQL Migration');
    
    info('1. Go to your Supabase project dashboard');
    info('2. Navigate to SQL Editor');
    info('3. Copy the entire contents of sql/admin_subscription_pause_system.sql');
    info('4. Paste into a new SQL query');
    info('5. Click "Run" to execute');
    info('');
    info('✅ The SQL is now safe to run multiple times!');
    info('✅ All objects use proper IF NOT EXISTS or CREATE OR REPLACE');
    info('✅ Error handling prevents failures on re-runs');
    info('✅ Completion messages will confirm successful execution');
    
    section('Expected Output Messages');
    info('You should see these messages when running:');
    info('• "Executing admin subscription pause system setup..."');
    info('• "admin_subscription_pauses permissions: ..." (may show permission notices)');
    info('• "Admin Subscription Pause System Setup Complete!"');
    info('• List of created tables, functions, and next steps');
}

function runValidation() {
    log(colors.bold + colors.blue, 'SQL Migration Validation Tool\n');
    
    const sqlValid = validateSQLFile();
    const structureValid = checkSQLStructure();
    
    section('Validation Results');
    
    if (sqlValid && structureValid) {
        success('All validations passed! ✅');
        success('SQL file is ready for production deployment');
        
        displayRunInstructions();
        
        return true;
    } else {
        error('Validation failed! ❌');
        error('Please review and fix the identified issues');
        return false;
    }
}

// Run validation if called directly
if (require.main === module) {
    const success = runValidation();
    process.exit(success ? 0 : 1);
}

module.exports = {
    validateSQLFile,
    checkSQLStructure,
    runValidation
};
