require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReferralRewardLogic() {
  console.log('🧪 Testing Referral Reward Logic - First Order Only');
  console.log('====================================================\n');

  try {
    // Create a test user
    const testUserId = 'test-user-' + Date.now();
    console.log('Step 1: Testing with first order...');
    
    // Test 1: First order with referral code
    const firstOrderResponse = await fetch('http://localhost:9002/api/referrals/process-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'order-1-' + Date.now(),
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
    }

    // Create a mock completed order for this user
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        id: 'completed-order-' + Date.now(),
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
        orderId: 'order-2-' + Date.now(),
        userId: testUserId,
        referralCode: 'ELIXR8967FF'
      })
    });

    const secondOrderResult = await secondOrderResponse.json();
    console.log('Second order result:', secondOrderResult);

    if (secondOrderResult.success && secondOrderResult.message === 'Referral reward only applies to first order.') {
      console.log('✅ Second order correctly rejected referral reward');
    } else {
      console.log('❌ Second order logic failed');
    }

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
    console.log(`First order reward processing: ${firstOrderResult.success && firstOrderResult.rewardPoints ? '✅ CORRECT' : '❌ FAILED'}`);
    console.log(`Second order reward prevention: ${secondOrderResult.success && secondOrderResult.message === 'Referral reward only applies to first order.' ? '✅ CORRECT' : '❌ FAILED'}`);
    
    const allCorrect = (firstOrderResult.success && firstOrderResult.rewardPoints) && 
                      (secondOrderResult.success && secondOrderResult.message === 'Referral reward only applies to first order.');
    
    console.log(`\n🏆 Overall Result: ${allCorrect ? '✅ WORKING CORRECTLY' : '❌ NEEDS FIXING'}`);
    
    if (allCorrect) {
      console.log('\n✨ Perfect! The referral system correctly:');
      console.log('   • Processes rewards for first orders only');
      console.log('   • Prevents rewards for subsequent orders');
      console.log('   • Maintains referral code integrity');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testReferralRewardLogic();
