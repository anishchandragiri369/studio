require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create both regular and service role clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteReferralFlow() {
  console.log('🧪 Testing Complete Referral Flow...\n');

  try {
    // Step 1: Create a referrer user (if doesn't exist)
    console.log('1. Setting up referrer user...');
    const referrerEmail = 'referrer@test.com';
    let referrerUser;
    
    // Check if referrer exists
    const { data: existingReferrer } = await supabaseAdmin.auth.admin.listUsers();
    referrerUser = existingReferrer.users.find(u => u.email === referrerEmail);
    
    if (!referrerUser) {
      const { data: newReferrer, error: referrerError } = await supabaseAdmin.auth.admin.createUser({
        email: referrerEmail,
        password: 'password123',
        email_confirm: true
      });
      
      if (referrerError) {
        console.error('❌ Error creating referrer:', referrerError);
        return;
      }
      referrerUser = newReferrer.user;
    }
    
    console.log(`✅ Referrer user ready: ${referrerUser.id}`);

    // Step 2: Ensure referrer has a referral code
    console.log('\n2. Checking referrer\'s referral code...');
    const { data: referrerRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('referral_code')
      .eq('user_id', referrerUser.id)
      .single();

    let referralCode;
    if (!referrerRewards || !referrerRewards.referral_code) {
      // Generate referral code for referrer
      referralCode = `TEST${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const { error: updateError } = await supabaseAdmin
        .from('user_rewards')
        .upsert({
          user_id: referrerUser.id,
          total_points: 0,
          redeemed_points: 0,
          referral_code: referralCode
        });
      
      if (updateError) {
        console.error('❌ Error setting referral code:', updateError);
        return;
      }
    } else {
      referralCode = referrerRewards.referral_code;
    }
    
    console.log(`✅ Referral code: ${referralCode}`);

    // Step 3: Test referral code validation
    console.log('\n3. Testing referral code validation...');
    const validateResponse = await fetch('http://localhost:3000/api/referrals/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralCode: referralCode.toLowerCase() }) // Test case insensitive
    });
    
    const validateResult = await validateResponse.json();
    console.log('Validation result:', validateResult);
    
    if (!validateResult.success) {
      console.error('❌ Referral code validation failed');
      return;
    }
    console.log('✅ Referral code validation passed');

    // Step 4: Create a new user with referral code
    console.log('\n4. Creating new user with referral code...');
    const newUserEmail = `newuser${Date.now()}@test.com`;
    const { data: newUser, error: newUserError } = await supabaseAdmin.auth.admin.createUser({
      email: newUserEmail,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        referral_code: referralCode
      }
    });
    
    if (newUserError) {
      console.error('❌ Error creating new user:', newUserError);
      return;
    }
    
    console.log(`✅ New user created: ${newUser.user.id}`);
    console.log(`✅ Referral code stored in metadata: ${newUser.user.user_metadata.referral_code}`);

    // Step 5: Simulate first order for new user
    console.log('\n5. Simulating first order...');
    const orderData = {
      orderAmount: 100,
      originalAmount: 100,
      orderItems: [{ 
        id: 'apple-juice',
        name: 'Apple Juice', 
        price: 100, 
        quantity: 1,
        type: 'regular'
      }],
      customerInfo: {
        name: 'Test User',
        email: newUserEmail,
        phone: '1234567890',
        address: {
          addressLine1: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '500001'  // Using a valid Hyderabad pincode
        }
      },
      userId: newUser.user.id,
      hasSubscriptions: false,
      hasRegularItems: true
    };

    const orderResponse = await fetch('http://localhost:3000/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(orderData)
    });

    const orderResult = await orderResponse.json();
    console.log('Order creation result:', orderResult);

    if (!orderResult.success) {
      console.error('❌ Order creation failed');
      return;
    }
    console.log('✅ Order created successfully');

    // Step 6: Wait a moment and check if referral rewards were processed
    console.log('\n6. Checking referral rewards...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    // Check referrer's rewards
    const { data: referrerUpdatedRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', referrerUser.id)
      .single();

    console.log('Referrer rewards after order:', referrerUpdatedRewards);

    // Check new user's rewards
    const { data: newUserRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', newUser.user.id)
      .single();

    console.log('New user rewards after order:', newUserRewards);

    // Check reward transactions
    const { data: transactions } = await supabaseAdmin
      .from('reward_transactions')
      .select('*')
      .in('user_id', [referrerUser.id, newUser.user.id])
      .order('created_at', { ascending: false });

    console.log('Recent reward transactions:', transactions);

    // Step 7: Verify results
    console.log('\n7. Verification Results:');
    
    if (referrerUpdatedRewards && referrerUpdatedRewards.total_points > 0) {
      console.log('✅ Referrer received reward points');
    } else {
      console.log('❌ Referrer did not receive reward points');
    }

    if (newUserRewards && newUserRewards.total_points > 0) {
      console.log('✅ New user received welcome points');
    } else {
      console.log('❌ New user did not receive welcome points');
    }

    if (transactions && transactions.length > 0) {
      console.log('✅ Reward transactions were recorded');
      transactions.forEach(t => {
        console.log(`  - ${t.transaction_type}: ${t.points} points for user ${t.user_id}`);
      });
    } else {
      console.log('❌ No reward transactions found');
    }

    console.log('\n🎉 Complete referral flow test finished!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testCompleteReferralFlow();
