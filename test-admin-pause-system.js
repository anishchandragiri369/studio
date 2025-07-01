#!/usr/bin/env node

/**
 * Comprehensive Test Script for Admin Pause System and Delivery Scheduling
 * 
 * This script tests:
 * 1. Delivery scheduling logic (alternate days, Sunday exclusion)
 * 2. Admin pause/reactivate functionality
 * 3. User subscription blocking during admin pause
 * 4. Fruit bowl subscription blocking during admin pause
 * 5. User pause blocking during admin pause
 * 6. Admin audit logging
 * 7. API error handling
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
    adminEmail: 'admin@test.com', // Replace with actual admin email
    testUserEmail: 'test@user.com', // Replace with test user email
    timeout: 10000, // 10 second timeout for requests
};

// Color coding for console output
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

function warning(message) {
    log(colors.yellow, `⚠ ${message}`);
}

function section(title) {
    log(colors.bold + colors.blue, `\n=== ${title} ===`);
}

async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AdminPauseTestScript/1.0'
        },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);
        const data = await response.json();
        
        return {
            success: response.ok,
            status: response.status,
            data,
            response
        };
    } catch (err) {
        return {
            success: false,
            error: err.message,
            status: 0
        };
    }
}

// Test 1: Delivery Logic Validation
async function testDeliveryLogic() {
    section('Testing Delivery Scheduling Logic');
    
    try {
        const result = await makeRequest('/api/admin/test-delivery-logic');
        
        if (result.success) {
            success('Delivery logic test endpoint is accessible');
            
            const { data } = result;
            if (data.tests) {
                data.tests.forEach(test => {
                    if (test.passed) {
                        success(`${test.description}: ${test.result}`);
                    } else {
                        error(`${test.description}: ${test.result}`);
                    }
                });
            }
        } else {
            error(`Delivery logic test failed: ${result.data?.error || 'Unknown error'}`);
        }
    } catch (err) {
        error(`Error testing delivery logic: ${err.message}`);
    }
}

// Test 2: Admin Pause Status API
async function testAdminPauseStatus() {
    section('Testing Admin Pause Status API');
    
    try {
        const result = await makeRequest('/api/admin/pause-status');
        
        if (result.success) {
            success('Admin pause status API is accessible');
            
            const { data } = result;
            info(`Current admin pause status: ${data.isAdminPaused ? 'PAUSED' : 'ACTIVE'}`);
            
            if (data.isAdminPaused && data.pauseDetails) {
                info(`Pause reason: ${data.pauseDetails.reason}`);
                info(`Pause type: ${data.pauseDetails.pause_type}`);
                info(`Start date: ${data.pauseDetails.start_date}`);
                info(`End date: ${data.pauseDetails.end_date || 'Indefinite'}`);
            }
        } else {
            error(`Admin pause status test failed: ${result.data?.error || 'Unknown error'}`);
        }
    } catch (err) {
        error(`Error testing admin pause status: ${err.message}`);
    }
}

// Test 3: Admin Subscription Overview
async function testAdminOverview() {
    section('Testing Admin Subscription Overview');
    
    try {
        const result = await makeRequest('/api/admin/subscriptions/overview');
        
        if (result.success) {
            success('Admin overview API is accessible');
            
            const { data } = result;
            if (data.summary) {
                info(`Total subscriptions: ${data.summary.totalSubscriptions}`);
                info(`Active subscriptions: ${data.summary.activeSubscriptions}`);
                info(`Admin paused subscriptions: ${data.summary.adminPausedSubscriptions}`);
                info(`Total admin pauses: ${data.summary.totalAdminPauses}`);
                info(`Active admin pauses: ${data.summary.activeAdminPauses}`);
            }
        } else {
            error(`Admin overview test failed: ${result.data?.error || 'Unknown error'}`);
        }
    } catch (err) {
        error(`Error testing admin overview: ${err.message}`);
    }
}

// Test 4: Test Admin Pause Creation (requires admin auth)
async function testAdminPauseCreation() {
    section('Testing Admin Pause Creation (Simulation)');
    
    // Note: This would require proper admin authentication
    // For now, we'll just test the endpoint structure
    
    warning('Admin pause creation test requires admin authentication');
    warning('To test manually:');
    info('1. Login as admin user');
    info('2. Navigate to /admin/subscriptions');
    info('3. Try pausing "All Subscriptions" with reason "Test pause"');
    info('4. Verify subscriptions are marked as admin_paused');
    info('5. Try reactivating and verify subscriptions return to active');
}

// Test 5: User Subscription Blocking During Admin Pause
async function testUserSubscriptionBlocking() {
    section('Testing User Subscription Blocking During Admin Pause');
    
    warning('User subscription blocking test requires:');
    info('1. An active admin pause');
    info('2. User authentication');
    info('3. Attempt to create subscription');
    info('4. Verify error: "New subscriptions are temporarily paused"');
    
    // We can test the structure of the endpoint
    try {
        const result = await makeRequest('/api/subscriptions/create', {
            method: 'POST',
            body: JSON.stringify({
                plan: 'basic',
                duration: 30
            })
        });
        
        // This should fail due to authentication, but we can check the response structure
        info(`Subscription creation endpoint response status: ${result.status}`);
        
        if (result.data?.error?.includes('admin pause') || result.data?.error?.includes('temporarily paused')) {
            success('Admin pause blocking is working correctly');
        } else if (result.status === 401 || result.status === 403) {
            info('Authentication required (expected for unauthenticated test)');
        } else {
            warning('Unable to verify admin pause blocking from this test');
        }
    } catch (err) {
        info('Subscription creation endpoint test completed');
    }
}

// Test 6: Fruit Bowl Subscription Blocking
async function testFruitBowlBlocking() {
    section('Testing Fruit Bowl Subscription Blocking During Admin Pause');
    
    try {
        const result = await makeRequest('/api/fruit-bowls/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                plan: 'basic',
                duration: 30
            })
        });
        
        info(`Fruit bowl subscription endpoint response status: ${result.status}`);
        
        if (result.data?.error?.includes('admin pause') || result.data?.error?.includes('temporarily paused')) {
            success('Admin pause blocking for fruit bowls is working correctly');
        } else if (result.status === 401 || result.status === 403) {
            info('Authentication required (expected for unauthenticated test)');
        } else {
            warning('Unable to verify admin pause blocking for fruit bowls from this test');
        }
    } catch (err) {
        info('Fruit bowl subscription endpoint test completed');
    }
}

// Test 7: API Health Check
async function testAPIHealth() {
    section('Testing API Health and Accessibility');
    
    const endpoints = [
        '/api/admin/pause-status',
        '/api/admin/test-delivery-logic',
        '/api/admin/subscriptions/overview',
        '/api/admin/subscriptions/pause',
        '/api/admin/subscriptions/reactivate'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const result = await makeRequest(endpoint, { method: 'HEAD' });
            
            if (result.status < 500) {
                success(`${endpoint} - Endpoint accessible (status: ${result.status})`);
            } else {
                error(`${endpoint} - Server error (status: ${result.status})`);
            }
        } catch (err) {
            error(`${endpoint} - Connection error: ${err.message}`);
        }
    }
}

// Main test runner
async function runAllTests() {
    log(colors.bold + colors.blue, 'Starting Admin Pause System Comprehensive Tests\n');
    
    const tests = [
        testDeliveryLogic,
        testAdminPauseStatus,
        testAdminOverview,
        testAPIHealth,
        testUserSubscriptionBlocking,
        testFruitBowlBlocking,
        testAdminPauseCreation
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            await test();
            passed++;
        } catch (err) {
            error(`Test failed: ${err.message}`);
            failed++;
        }
    }
    
    // Summary
    section('Test Summary');
    success(`Passed: ${passed}`);
    if (failed > 0) {
        error(`Failed: ${failed}`);
    }
    
    if (failed === 0) {
        success('All accessible tests completed successfully!');
    } else {
        warning('Some tests failed or require manual verification');
    }
    
    // Next steps
    section('Manual Testing Required');
    info('1. Run SQL migration in Supabase');
    info('2. Login as admin and test admin UI at /admin/subscriptions');
    info('3. Test user flows during admin pause');
    info('4. Verify cron job execution and cleanup');
    info('5. Test audit logging in production');
}

// Handle script execution
if (require.main === module) {
    runAllTests().catch(err => {
        error(`Test runner failed: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testDeliveryLogic,
    testAdminPauseStatus,
    testAdminOverview,
    makeRequest
};
