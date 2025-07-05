require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReferralRewardLogic() {
  console.log('🧪 Testing Referral Reward Logic - First Order Only');
  console.log('====================================================\n');

  try {
    // Create a test user with proper UUID
    const testUserId = uuidv4();
    const testOrderId1 = uuidv4();
    const testOrderId2 = uuidv4();
    
    console.log('Test User ID:', testUserId);
    console.log('Step 1: Testing with first order (no previous orders)...');
    
    // Test 1: First order with referral code (should work)
    const firstOrderResponse = await fetch('http://localhost:9002/api/referrals/process-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId1,
        userId: testUserId,
        referralCode: 'ELIXR8967FF'
      })
    });

    const firstOrderResult = await firstOrderResponse.json();
    console.log('First order result:', firstOrderResult);

    if (firstOrderResult.success && firstOrderResult.rewardPoints) {
      console.log('✅ First order correctly processed referral reward');
      console.log(`   Reward points: ${firstOrderResult.rewardPoints}`);
    } else {
      console.log('❌ First order failed to process referral reward');
      console.log('   This might be expected if no previous orders exist');
    }

    // Create a mock completed order for this user (to simulate they have a completed order)
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        id: testOrderId1,
        user_id: testUserId,
        total_amount: 100,
        status: 'completed',
        referral_code: 'ELIXR8967FF',
        created_at: new Date().toISOString()
      }]);

    if (orderError) {
      console.error('Error creating mock order:', orderError);
    } else {
      console.log('✅ Created mock completed order for user');
    }

    console.log('\nStep 2: Testing with second order (should NOT get reward)...');
    
    // Test 2: Second order with referral code (should not get reward)
    const secondOrderResponse = await fetch('http://localhost:9002/api/referrals/process-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId2,
        userId: testUserId,
        referralCode: 'ELIXR8967FF'
      })
    });

    const secondOrderResult = await secondOrderResponse.json();
    console.log('Second order result:', secondOrderResult);

    if (secondOrderResult.success && secondOrderResult.message === 'Referral reward only applies to first order.') {
      console.log('✅ Second order correctly rejected referral reward');
    } else {
      console.log('❌ Second order should have been rejected');
    }

    // Test 3: Check if user has already used this referral code
    console.log('\nStep 3: Testing duplicate referral code usage...');
    
    const duplicateResponse = await fetch('http://localhost:9002/api/referrals/process-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: uuidv4(),
        userId: testUserId,
        referralCode: 'ELIXR8967FF'
      })
    });

    const duplicateResult = await duplicateResponse.json();
    console.log('Duplicate referral result:', duplicateResult);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabaseAdmin
      .from('orders')
      .delete()
      .eq('user_id', testUserId);

    await supabaseAdmin
      .from('referral_rewards')
      .delete()
      .eq('referred_user_id', testUserId);

    console.log('\n🎯 SUMMARY:');
    console.log('==========');
    console.log(`First order (no previous orders): ${firstOrderResult.success ? '✅ PROCESSED' : '❌ FAILED'}`);
    console.log(`Second order (has previous orders): ${secondOrderResult.success && secondOrderResult.message?.includes('first order') ? '✅ CORRECTLY REJECTED' : '❌ FAILED'}`);
    console.log(`Duplicate referral handling: ${duplicateResult.success && duplicateResult.message?.includes('already') ? '✅ CORRECTLY REJECTED' : '❌ FAILED'}`);

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testReferralRewardLogic();
