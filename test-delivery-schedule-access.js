#!/usr/bin/env node

/**
 * Test Admin Delivery Schedule Access
 * 
 * This script tests if the delivery schedule page authentication is working correctly.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDeliveryScheduleAccess() {
  console.log('🚀 Testing Delivery Schedule Access...\n');

  try {
    // First, test with an admin user
    console.log('1. Testing with admin user...');
    
    // Check if we have admin email in environment
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
    
    // Check if admin email exists in admins table
    const { data: adminCheck, error: adminError } = await supabase
      .from('admins')
      .select('email')
      .eq('email', adminEmail)
      .single();

    if (adminError) {
      console.error('❌ Admin check failed:', adminError.message);
      return;
    }

    if (adminCheck) {
      console.log('✅ Admin user found in database:', adminCheck.email);
    } else {
      console.log('⚠️  Admin user not found in database');
    }

    // Test the delivery schedule API endpoint
    console.log('\n2. Testing delivery schedule API...');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/delivery-schedule`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Delivery schedule API accessible');
        console.log(`📊 Found ${Array.isArray(data) ? data.length : 0} delivery schedule settings`);
      } else {
        console.log(`❌ Delivery schedule API failed: ${response.status} ${response.statusText}`);
      }
    } catch (apiError) {
      console.log(`❌ API request failed: ${apiError.message}`);
    }

    // Test authentication with Supabase
    console.log('\n3. Testing authentication flow...');
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session check failed:', sessionError.message);
    } else if (session?.user) {
      console.log('✅ User is authenticated:', session.user.email);
      
      // Check if this user is admin
      const { data: isAdminData, error: isAdminError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', session.user.email);
      
      if (isAdminError) {
        console.log('❌ Admin check failed:', isAdminError.message);
      } else if (isAdminData && isAdminData.length > 0) {
        console.log('✅ User is confirmed admin');
      } else {
        console.log('⚠️  User is not admin');
      }
    } else {
      console.log('ℹ️  No user session found (not authenticated)');
    }

    console.log('\n4. Summary:');
    console.log('- If you can access /admin/subscriptions but not /admin/delivery-schedule,');
    console.log('  the issue was likely in the authentication logic.');
    console.log('- The fix should now allow admin users to access delivery schedule.');
    console.log('- Test by logging in as an admin and navigating to delivery schedule.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDeliveryScheduleAccess();
