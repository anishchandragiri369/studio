/**
 * Comprehensive test script for the Delivery Schedule Settings system
 * Tests database functions, API endpoints, and integration
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = 'http://localhost:9002'; // Adjust based on your dev server

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testDatabaseFunctions() {
  log(colors.bold + colors.blue, '\n📊 Testing Database Functions...\n');

  const tests = [
    {
      name: 'Get Delivery Schedule Settings',
      test: async () => {
        const { data, error } = await supabase.rpc('get_delivery_schedule_settings');
        if (error) throw error;
        
        console.log('Settings found:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('Sample setting:', {
            type: data[0].subscription_type,
            gap: data[0].delivery_gap_days,
            daily: data[0].is_daily
          });
        }
        return data;
      }
    },
    {
      name: 'Calculate Next Delivery Date for Juices',
      test: async () => {
        const { data, error } = await supabase.rpc('calculate_next_delivery_date', {
          p_subscription_type: 'juices',
          p_current_date: new Date().toISOString()
        });
        if (error) throw error;
        
        console.log('Next delivery date for juices:', data);
        return data;
      }
    },
    {
      name: 'Calculate Next Delivery Date for Fruit Bowls',
      test: async () => {
        const { data, error } = await supabase.rpc('calculate_next_delivery_date', {
          p_subscription_type: 'fruit_bowls',
          p_current_date: new Date().toISOString()
        });
        if (error) throw error;
        
        console.log('Next delivery date for fruit bowls:', data);
        return data;
      }
    },
    {
      name: 'Test Update Delivery Schedule Setting',
      test: async () => {
        const { data, error } = await supabase.rpc('update_delivery_schedule_setting', {
          p_subscription_type: 'customized',
          p_delivery_gap_days: 5,
          p_is_daily: false,
          p_description: 'Test update - every 5 days',
          p_change_reason: 'Testing the system',
          p_admin_user_id: null
        });
        if (error) throw error;
        
        console.log('Update result:', data);
        
        // Revert the change
        await supabase.rpc('update_delivery_schedule_setting', {
          p_subscription_type: 'customized',
          p_delivery_gap_days: 3,
          p_is_daily: false,
          p_description: 'Every 3 days delivery schedule for customized subscriptions (default)',
          p_change_reason: 'Reverting test change',
          p_admin_user_id: null
        });
        
        return data;
      }
    },
    {
      name: 'Get Audit History',
      test: async () => {
        const { data, error } = await supabase.rpc('get_delivery_schedule_audit_history', {
          p_subscription_type: null,
          p_limit: 5
        });
        if (error) throw error;
        
        console.log('Audit records found:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('Latest audit record:', {
            type: data[0].subscription_type,
            old_gap: data[0].old_delivery_gap_days,
            new_gap: data[0].new_delivery_gap_days,
            changed_by: data[0].changed_by_email,
            date: data[0].created_at
          });
        }
        return data;
      }
    }
  ];

  for (const test of tests) {
    try {
      log(colors.cyan, `Testing: ${test.name}`);
      await test.test();
      log(colors.green, `✅ ${test.name} - PASSED`);
    } catch (error) {
      log(colors.red, `❌ ${test.name} - FAILED: ${error.message}`);
    }
  }
}

async function testAPIEndpoints() {
  log(colors.bold + colors.blue, '\n🔌 Testing API Endpoints...\n');

  const tests = [
    {
      name: 'GET /api/admin/delivery-schedule/settings',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/admin/delivery-schedule/settings`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error}`);
        }
        
        console.log('Settings response:', {
          success: data.success,
          settings_count: data.settings?.length || 0
        });
        
        return data;
      }
    },
    {
      name: 'PUT /api/admin/delivery-schedule/settings (Update customized)',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/admin/delivery-schedule/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_type: 'customized',
            delivery_gap_days: 4,
            is_daily: false,
            description: 'Test API update - every 4 days',
            change_reason: 'Testing API endpoint',
            admin_user_id: null
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error}`);
        }
        
        console.log('Update response:', data);
        
        // Revert the change
        await fetch(`${baseUrl}/api/admin/delivery-schedule/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_type: 'customized',
            delivery_gap_days: 3,
            is_daily: false,
            description: 'Every 3 days delivery schedule for customized subscriptions (default)',
            change_reason: 'Reverting API test change',
            admin_user_id: null
          })
        });
        
        return data;
      }
    },
    {
      name: 'GET /api/admin/delivery-schedule/audit',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/admin/delivery-schedule/audit?limit=3`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error}`);
        }
        
        console.log('Audit response:', {
          success: data.success,
          audit_records: data.audit_history?.length || 0
        });
        
        return data;
      }
    },
    {
      name: 'POST /api/admin/delivery-schedule/test (Test calculation)',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/admin/delivery-schedule/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_type: 'juices',
            current_date: new Date().toISOString()
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error}`);
        }
        
        console.log('Test calculation response:', {
          subscription_type: data.subscription_type,
          next_delivery: data.next_delivery_date,
          days_until_next: data.days_until_next_delivery,
          schedule: data.current_settings?.formatted_schedule
        });
        
        return data;
      }
    },
    {
      name: 'POST /api/admin/delivery-schedule/test (Test with plan_id)',
      test: async () => {
        const response = await fetch(`${baseUrl}/api/admin/delivery-schedule/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: 'fruit_bowl_daily',
            current_date: new Date().toISOString()
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${data.error}`);
        }
        
        console.log('Plan ID test response:', {
          derived_type: data.subscription_type,
          plan_id: 'fruit_bowl_daily',
          next_delivery: data.next_delivery_date,
          schedule: data.current_settings?.formatted_schedule
        });
        
        return data;
      }
    }
  ];

  for (const test of tests) {
    try {
      log(colors.cyan, `Testing: ${test.name}`);
      await test.test();
      log(colors.green, `✅ ${test.name} - PASSED`);
    } catch (error) {
      log(colors.red, `❌ ${test.name} - FAILED: ${error.message}`);
    }
  }
}

async function testHelperFunctions() {
  log(colors.bold + colors.blue, '\n🔧 Testing Helper Functions...\n');

  // These would typically be imported, but for testing we'll define inline
  const getSubscriptionTypeFromPlanId = (planId) => {
    const mapping = {
      'juice_weekly': 'juices',
      'juice_monthly': 'juices',
      'fruit_bowl_daily': 'fruit_bowls',
      'fruit_bowl_weekly': 'fruit_bowls',
      'customized_weekly': 'customized',
      'customized_monthly': 'customized',
    };
    
    if (mapping[planId]) {
      return mapping[planId];
    }
    
    if (planId.toLowerCase().includes('juice')) {
      return 'juices';
    } else if (planId.toLowerCase().includes('fruit') || planId.toLowerCase().includes('bowl')) {
      return 'fruit_bowls';
    } else if (planId.toLowerCase().includes('custom')) {
      return 'customized';
    }
    
    return 'customized';
  };

  const tests = [
    {
      name: 'Plan ID to Subscription Type Mapping',
      test: () => {
        const testCases = [
          { planId: 'juice_weekly', expected: 'juices' },
          { planId: 'fruit_bowl_daily', expected: 'fruit_bowls' },
          { planId: 'customized_monthly', expected: 'customized' },
          { planId: 'unknown_plan', expected: 'customized' }, // fallback
          { planId: 'special_juice_plan', expected: 'juices' }, // pattern matching
        ];
        
        for (const testCase of testCases) {
          const result = getSubscriptionTypeFromPlanId(testCase.planId);
          console.log(`${testCase.planId} → ${result} (expected: ${testCase.expected})`);
          
          if (result !== testCase.expected) {
            throw new Error(`Expected ${testCase.expected}, got ${result} for planId: ${testCase.planId}`);
          }
        }
        
        return testCases;
      }
    }
  ];

  for (const test of tests) {
    try {
      log(colors.cyan, `Testing: ${test.name}`);
      await test.test();
      log(colors.green, `✅ ${test.name} - PASSED`);
    } catch (error) {
      log(colors.red, `❌ ${test.name} - FAILED: ${error.message}`);
    }
  }
}

async function displayCurrentSettings() {
  log(colors.bold + colors.magenta, '\n📋 Current Delivery Schedule Settings:\n');

  try {
    const { data: settings, error } = await supabase.rpc('get_delivery_schedule_settings');
    if (error) throw error;

    if (!settings || settings.length === 0) {
      log(colors.yellow, 'No delivery schedule settings found');
      return;
    }

    settings.forEach(setting => {
      const scheduleText = setting.is_daily 
        ? 'Daily delivery (every day)'
        : `Every ${setting.delivery_gap_days} day${setting.delivery_gap_days > 1 ? 's' : ''}`;
      
      console.log(`
🔹 ${setting.subscription_type.toUpperCase()}
   Schedule: ${scheduleText}
   Description: ${setting.description || 'No description'}
   Active: ${setting.is_active ? 'Yes' : 'No'}
   Last Updated: ${new Date(setting.updated_at).toLocaleString()}
   Updated By: ${setting.updated_by_email || 'System'}
      `);
    });
  } catch (error) {
    log(colors.red, `❌ Failed to fetch current settings: ${error.message}`);
  }
}

async function runAllTests() {
  log(colors.bold + colors.green, '🚀 Starting Delivery Schedule Settings Tests\n');

  await displayCurrentSettings();
  await testDatabaseFunctions();
  await testAPIEndpoints();
  await testHelperFunctions();

  log(colors.bold + colors.green, '\n✅ All tests completed!\n');
}

// Run the tests
runAllTests().catch(error => {
  log(colors.bold + colors.red, `\n❌ Test execution failed: ${error.message}\n`);
  process.exit(1);
});
