const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config({ path: '.env.local' });

// Simple fetch implementation using Node.js built-in modules
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9002';

console.log('🚀 Comprehensive System Test Runner');
console.log('='.repeat(50));
console.log(`API Base: ${API_BASE}`);
console.log(`Supabase URL: ${supabaseUrl ? 'Configured' : 'Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  async runTest(category, name, testFunction) {
    const startTime = Date.now();
    this.results.total++;
    
    try {
      console.log(`🧪 Testing: ${category} - ${name}...`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      if (result.status === 'success') {
        this.results.passed++;
        console.log(`✅ ${name}: ${result.message} (${duration}ms)`);
      } else if (result.status === 'warning') {
        this.results.warnings++;
        console.log(`⚠️  ${name}: ${result.message} (${duration}ms)`);
      } else {
        this.results.failed++;
        console.log(`❌ ${name}: ${result.message} (${duration}ms)`);
      }
      
      this.results.details.push({
        category,
        name,
        status: result.status,
        message: result.message,
        duration,
        details: result.details
      });
      
    } catch (error) {
      this.results.failed++;
      const duration = Date.now() - startTime;
      console.log(`❌ ${name}: ${error.message} (${duration}ms)`);
      
      this.results.details.push({
        category,
        name,
        status: 'failure',
        message: error.message,
        duration
      });
    }
  }

  generateReport() {
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(30));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n🔍 FAILED TESTS:');
      this.results.details
        .filter(test => test.status === 'failure')
        .forEach(test => {
          console.log(`- ${test.category}/${test.name}: ${test.message}`);
        });
    }
    
    if (this.results.warnings > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results.details
        .filter(test => test.status === 'warning')
        .forEach(test => {
          console.log(`- ${test.category}/${test.name}: ${test.message}`);
        });
    }
    
    return this.results;
  }
}

async function runComprehensiveTests() {
  const runner = new TestRunner();
  
  // Database Tests
  console.log('\n📊 DATABASE TESTS');
  console.log('-'.repeat(20));
  
  await runner.runTest('Database', 'Supabase Connection', async () => {
    const { data, error } = await supabase.from('delivery_schedule_settings').select('id').limit(1);
    if (error) throw new Error(`Connection failed: ${error.message}`);
    return { status: 'success', message: 'Supabase connection working' };
  });
  
  await runner.runTest('Database', 'Delivery Schedule Settings', async () => {
    const { data, error } = await supabase
      .from('delivery_schedule_settings')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw new Error(`Table access failed: ${error.message}`);
    if (!data || data.length === 0) {
      return { status: 'warning', message: 'No delivery schedule settings found' };
    }
    return { 
      status: 'success', 
      message: `Found ${data.length} delivery settings`,
      details: data 
    };
  });
  
  await runner.runTest('Database', 'Delivery Schedule Audit', async () => {
    const { data, error } = await supabase
      .from('delivery_schedule_audit')
      .select('*')
      .limit(5);
    
    if (error) throw new Error(`Audit table access failed: ${error.message}`);
    return { 
      status: 'success', 
      message: `Found ${data?.length || 0} audit records`,
      details: data 
    };
  });
  
  // API Tests
  console.log('\n🔌 API TESTS');
  console.log('-'.repeat(20));
  
  await runner.runTest('API', 'Admin Delivery Schedule', async () => {
    const response = await fetch(`${API_BASE}/api/admin/delivery-schedule`);
    if (!response.ok) {
      throw new Error(`API failed with status: ${response.status}`);
    }
    const data = await response.json();
    return { 
      status: 'success', 
      message: `API working, returned ${data.length} settings` 
    };
  });
  
  await runner.runTest('API', 'Admin Audit History', async () => {
    const response = await fetch(`${API_BASE}/api/admin/delivery-schedule/audit`);
    if (!response.ok) {
      throw new Error(`Audit API failed with status: ${response.status}`);
    }
    const data = await response.json();
    return { 
      status: 'success', 
      message: `Audit API working, found ${data.audit_history?.length || 0} records` 
    };
  });
  
  await runner.runTest('API', 'Subscription Creation Endpoint', async () => {
    const response = await fetch(`${API_BASE}/api/subscriptions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    if (response.status === 400 || response.status === 401) {
      return { status: 'warning', message: 'Endpoint exists but requires valid data/auth' };
    }
    if (response.ok) {
      return { status: 'success', message: 'Subscription API endpoint working' };
    }
    throw new Error(`Subscription API failed: ${response.status}`);
  });
  
  await runner.runTest('API', 'Order Creation Endpoint', async () => {
    const response = await fetch(`${API_BASE}/api/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    if (response.status === 400 || response.status === 401) {
      return { status: 'warning', message: 'Endpoint exists but requires valid data/auth' };
    }
    if (response.ok) {
      return { status: 'success', message: 'Order API endpoint working' };
    }
    throw new Error(`Order API failed: ${response.status}`);
  });
  
  // Feature Tests
  console.log('\n🎯 FEATURE TESTS');
  console.log('-'.repeat(20));
  
  await runner.runTest('Features', 'Comprehensive Test Page', async () => {
    const response = await fetch(`${API_BASE}/comprehensive-test`);
    if (response.ok) {
      return { status: 'success', message: 'Comprehensive test page accessible' };
    }
    throw new Error(`Test page failed: ${response.status}`);
  });
  
  await runner.runTest('Features', 'Admin Delivery Schedule UI', async () => {
    const response = await fetch(`${API_BASE}/admin/delivery-schedule`);
    if (response.ok) {
      return { status: 'success', message: 'Admin delivery schedule UI accessible' };
    }
    throw new Error(`Admin UI failed: ${response.status}`);
  });
  
  await runner.runTest('Features', 'Email API Endpoints', async () => {
    const endpoints = [
      'send-subscription-email',
      'send-order-email',
      'send-payment-failure-email'
    ];
    
    let workingEndpoints = 0;
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE}/api/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        if (response.status === 400 || response.status === 401 || response.ok) {
          workingEndpoints++;
        }
      } catch (error) {
        // Endpoint might not exist
      }
    }
    
    if (workingEndpoints === endpoints.length) {
      return { status: 'success', message: 'All email APIs accessible' };
    } else if (workingEndpoints > 0) {
      return { status: 'warning', message: `${workingEndpoints}/${endpoints.length} email APIs working` };
    } else {
      throw new Error('No email APIs responding');
    }
  });
  
  // Integration Tests
  console.log('\n🔄 INTEGRATION TESTS');
  console.log('-'.repeat(20));
  
  await runner.runTest('Integration', 'Settings-Based Delivery Scheduler', async () => {
    // Test if the delivery scheduler is using settings from the database
    const { data: settings } = await supabase
      .from('delivery_schedule_settings')
      .select('*')
      .eq('is_active', true)
      .eq('subscription_type', 'juices');
    
    if (!settings || settings.length === 0) {
      return { status: 'warning', message: 'No juice subscription settings found' };
    }
    
    const setting = settings[0];
    const expectedGap = setting.is_daily ? 1 : setting.delivery_gap_days;
    
    return { 
      status: 'success', 
      message: `Delivery scheduler configured: ${setting.is_daily ? 'Daily' : `${expectedGap} day gap`}` 
    };
  });
  
  await runner.runTest('Integration', 'Audit Trail Functionality', async () => {
    const { data: auditRecords } = await supabase
      .from('delivery_schedule_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!auditRecords || auditRecords.length === 0) {
      return { status: 'warning', message: 'No audit records found - system may be newly installed' };
    }
    
    const latestAudit = auditRecords[0];
    return { 
      status: 'success', 
      message: `Audit trail working - last change: ${latestAudit.action} by ${latestAudit.changed_by}` 
    };
  });
  
  const results = runner.generateReport();
  
  console.log('\n🎉 COMPREHENSIVE TEST COMPLETE!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Review any failed tests or warnings above');
  console.log('2. Access the comprehensive test UI at: http://localhost:9002/comprehensive-test');
  console.log('3. Test admin delivery schedule UI at: http://localhost:9002/admin/delivery-schedule');
  console.log('4. Create test subscriptions to verify end-to-end functionality');
  
  return results;
}

// Run the tests
runComprehensiveTests().catch(console.error);
