#!/usr/bin/env node

/**
 * Admin User Verification Script
 * 
 * This script helps verify if a user is properly set up as an admin.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAdminUser() {
  console.log('🔍 Admin User Verification');
  console.log('==========================\n');

  try {
    // List all admins
    console.log('1️⃣ Checking admin users in database...');
    
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('*');

    if (adminError) {
      console.error('❌ Error fetching admins:', adminError.message);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️  No admin users found in the database');
      console.log('💡 To add an admin user, run:');
      console.log('   INSERT INTO admins (email) VALUES (\'your-email@example.com\');');
      return;
    }

    console.log(`✅ Found ${admins.length} admin user(s):`);
    admins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.email} (ID: ${admin.id})`);
    });

    // Test authentication flow simulation
    console.log('\n2️⃣ Testing admin check logic...');
    
    // Simulate the AuthContext admin check for each admin
    for (const admin of admins) {
      const { data: adminCheck, error: checkError } = await supabase
        .from('admins')
        .select('email')
        .eq('email', admin.email);

      if (checkError) {
        console.log(`❌ Admin check failed for ${admin.email}: ${checkError.message}`);
      } else if (adminCheck && adminCheck.length > 0) {
        console.log(`✅ Admin check passed for ${admin.email}`);
      } else {
        console.log(`❌ Admin check failed for ${admin.email}: not found`);
      }
    }

    console.log('\n📋 INSTRUCTIONS:');
    console.log('1. Make sure you are logged in with one of the admin emails above');
    console.log('2. The AuthContext should detect you as isAdmin=true');
    console.log('3. You should then be able to access /admin/delivery-schedule');
    
    console.log('\n🔧 If you need to add yourself as admin:');
    console.log('1. Replace YOUR_EMAIL with your actual email:');
    console.log('   INSERT INTO admins (email) VALUES (\'YOUR_EMAIL\');');
    console.log('2. Or use the Supabase dashboard to add a record to the admins table');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyAdminUser();
