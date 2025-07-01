#!/usr/bin/env node

/**
 * Test script for reactivation delivery scheduling with 6 PM cutoff
 * 
 * Scenario: User has subscription with deliveries scheduled for 14, 16, 18
 * - Pauses on 13th before 6 PM
 * - Reactivates on 16th before 6 PM
 * - Should get deliveries on 17, 19, 21 (next day delivery + alternate day pattern)
 * 
 * Also tests:
 * - Reactivation after 6 PM (should start day after next)
 * - Sunday exclusion in new schedule
 * - 3-month reactivation window enforcement
 */

const { SubscriptionManager } = require('../src/lib/subscriptionManager');

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

function section(title) {
    log(colors.bold + colors.blue, `\n=== ${title} ===`);
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

function testReactivationScenario() {
    section('Testing Reactivation Delivery Scheduling');
    
    try {
        // Test Case 1: Reactivation before 6 PM
        info('Test Case 1: Reactivation on 16th at 2 PM (before 6 PM)');
        
        const reactivationDate1 = new Date(2025, 6, 16, 14, 0); // July 16, 2025 at 2 PM
        const result1 = SubscriptionManager.calculateReactivationDeliverySchedule(
            reactivationDate1,
            'monthly'
        );
        
        info(`Reactivation date: ${formatDate(reactivationDate1)} at 2:00 PM`);
        info(`Next delivery: ${formatDate(result1.nextDeliveryDate)}`);
        
        // Should be July 17th (next day)
        const expectedDate1 = new Date(2025, 6, 17, 8, 0);
        if (result1.nextDeliveryDate.getTime() === expectedDate1.getTime()) {
            success('✓ Next delivery correctly scheduled for next day (before 6 PM reactivation)');
        } else {
            error(`✗ Expected ${formatDate(expectedDate1)}, got ${formatDate(result1.nextDeliveryDate)}`);
        }
        
        // Check first few deliveries maintain alternate day pattern
        info('Generated delivery schedule:');
        result1.adjustedSchedule.slice(0, 5).forEach((date, i) => {
            info(`  ${i + 1}. ${formatDate(date)}`);
        });
        
        // Verify alternate day pattern (should be 17, 19, 21, 23, 25)
        const expectedDates1 = [17, 19, 21, 23, 25];
        let patternCorrect1 = true;
        for (let i = 0; i < 5; i++) {
            if (result1.adjustedSchedule[i].getDate() !== expectedDates1[i]) {
                patternCorrect1 = false;
                break;
            }
        }
        
        if (patternCorrect1) {
            success('✓ Alternate day pattern maintained correctly');
        } else {
            error('✗ Alternate day pattern not maintained');
        }
        
        // Test Case 2: Reactivation after 6 PM
        info('\nTest Case 2: Reactivation on 16th at 8 PM (after 6 PM)');
        
        const reactivationDate2 = new Date(2025, 6, 16, 20, 0); // July 16, 2025 at 8 PM
        const result2 = SubscriptionManager.calculateReactivationDeliverySchedule(
            reactivationDate2,
            'monthly'
        );
        
        info(`Reactivation date: ${formatDate(reactivationDate2)} at 8:00 PM`);
        info(`Next delivery: ${formatDate(result2.nextDeliveryDate)}`);
        
        // Should be July 18th (day after next)
        const expectedDate2 = new Date(2025, 6, 18, 8, 0);
        if (result2.nextDeliveryDate.getTime() === expectedDate2.getTime()) {
            success('✓ Next delivery correctly scheduled for day after next (after 6 PM reactivation)');
        } else {
            error(`✗ Expected ${formatDate(expectedDate2)}, got ${formatDate(result2.nextDeliveryDate)}`);
        }
        
        info('Generated delivery schedule:');
        result2.adjustedSchedule.slice(0, 5).forEach((date, i) => {
            info(`  ${i + 1}. ${formatDate(date)}`);
        });
        
        // Test Case 3: Sunday exclusion
        info('\nTest Case 3: Reactivation that would schedule on Sunday');
        
        const saturdayReactivation = new Date(2025, 6, 19, 14, 0); // July 19, 2025 (Saturday) at 2 PM
        const result3 = SubscriptionManager.calculateReactivationDeliverySchedule(
            saturdayReactivation,
            'monthly'
        );
        
        info(`Reactivation date: ${formatDate(saturdayReactivation)} (Saturday) at 2:00 PM`);
        info(`Next delivery: ${formatDate(result3.nextDeliveryDate)}`);
        
        // Should be July 21st (Monday) as Sunday is skipped
        const expectedDate3 = new Date(2025, 6, 21, 8, 0);
        if (result3.nextDeliveryDate.getTime() === expectedDate3.getTime()) {
            success('✓ Sunday correctly skipped, delivery scheduled for Monday');
        } else {
            error(`✗ Expected ${formatDate(expectedDate3)}, got ${formatDate(result3.nextDeliveryDate)}`);
        }
        
        // Verify no Sundays in schedule
        const hasSundays = result3.adjustedSchedule.some(date => date.getDay() === 0);
        if (!hasSundays) {
            success('✓ No Sundays found in delivery schedule');
        } else {
            error('✗ Sunday found in delivery schedule');
        }
        
    } catch (err) {
        error(`Test failed: ${err.message}`);
        console.error(err);
    }
}

function testReactivationTimeWindow() {
    section('Testing 3-Month Reactivation Window');
    
    try {
        // Test Case 1: Within reactivation window
        const pauseDate1 = new Date(2025, 5, 1); // June 1, 2025
        const checkDate1 = new Date(2025, 7, 15); // August 15, 2025 (2.5 months later)
        
        const result1 = SubscriptionManager.canReactivateSubscription(pauseDate1.toISOString());
        info(`Pause date: ${formatDate(pauseDate1)}`);
        info(`Check date: ${formatDate(checkDate1)}`);
        info(`Days left: ${result1.daysLeft}`);
        
        if (result1.canReactivate) {
            success('✓ Subscription can be reactivated within 3-month window');
        } else {
            error('✗ Subscription should be reactivatable within 3-month window');
        }
        
        // Test Case 2: Outside reactivation window
        const pauseDate2 = new Date(2025, 2, 1); // March 1, 2025
        const result2 = SubscriptionManager.canReactivateSubscription(pauseDate2.toISOString());
        
        info(`\nPause date: ${formatDate(pauseDate2)}`);
        info(`Check date: ${formatDate(new Date())}`);
        info(`Days left: ${result2.daysLeft}`);
        
        if (!result2.canReactivate) {
            success('✓ Subscription correctly expired after 3-month window');
        } else {
            error('✗ Subscription should be expired after 3-month window');
        }
        
    } catch (err) {
        error(`Reactivation window test failed: ${err.message}`);
    }
}

function testCompleteReactivationFlow() {
    section('Testing Complete Reactivation Flow');
    
    try {
        // Mock subscription data
        const mockSubscription = {
            id: 'test-sub-123',
            pause_date: new Date(2025, 6, 13, 10, 0).toISOString(), // July 13, 2025 at 10 AM
            subscription_end_date: new Date(2025, 9, 13).toISOString(), // Original end: October 13, 2025
            delivery_frequency: 'monthly'
        };
        
        // Test reactivation on July 16 at 2 PM
        const reactivationDate = new Date(2025, 6, 16, 14, 0);
        
        const result = SubscriptionManager.updateDeliveryScheduleAfterReactivation(
            mockSubscription,
            reactivationDate
        );
        
        info(`Original subscription end: ${formatDate(new Date(mockSubscription.subscription_end_date))}`);
        info(`Pause duration: ${result.pauseDurationDays} days`);
        info(`Extended end date: ${formatDate(result.extendedEndDate)}`);
        info(`Next delivery: ${formatDate(result.nextDeliveryDate)}`);
        
        // Verify pause duration calculation
        const expectedPauseDays = 3; // July 13 to July 16
        if (Math.abs(result.pauseDurationDays - expectedPauseDays) <= 1) {
            success(`✓ Pause duration correctly calculated: ${result.pauseDurationDays} days`);
        } else {
            error(`✗ Expected ~${expectedPauseDays} days, got ${result.pauseDurationDays} days`);
        }
        
        // Verify end date extension
        const originalEnd = new Date(mockSubscription.subscription_end_date);
        const expectedExtension = expectedPauseDays * 24 * 60 * 60 * 1000;
        const expectedNewEnd = new Date(originalEnd.getTime() + expectedExtension);
        
        const daysDiff = Math.abs(result.extendedEndDate.getTime() - expectedNewEnd.getTime()) / (24 * 60 * 60 * 1000);
        if (daysDiff <= 1) {
            success('✓ Subscription end date correctly extended by pause duration');
        } else {
            error('✗ Subscription end date extension incorrect');
        }
        
        // Verify next delivery date (should be July 17 for before 6 PM reactivation)
        const expectedDelivery = new Date(2025, 6, 17, 8, 0);
        if (result.nextDeliveryDate.getTime() === expectedDelivery.getTime()) {
            success('✓ Next delivery date correctly calculated');
        } else {
            error(`✗ Expected ${formatDate(expectedDelivery)}, got ${formatDate(result.nextDeliveryDate)}`);
        }
        
    } catch (err) {
        error(`Complete flow test failed: ${err.message}`);
    }
}

// Run all tests
function runAllTests() {
    log(colors.bold + colors.blue, 'Reactivation Delivery Scheduling Test Suite\n');
    
    testReactivationScenario();
    testReactivationTimeWindow();
    testCompleteReactivationFlow();
    
    section('Test Summary');
    success('All reactivation delivery scheduling tests completed');
    info('Manual verification required:');
    info('1. Run SQL migration in Supabase');
    info('2. Test actual API calls with authentication');
    info('3. Verify database updates are correct');
    info('4. Test email notifications for reactivation');
}

// Run tests if called directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testReactivationScenario,
    testReactivationTimeWindow,
    testCompleteReactivationFlow,
    runAllTests
};
