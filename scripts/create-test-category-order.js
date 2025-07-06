/**
 * Script to create a test order with category-based subscription
 * This will help verify that the SubscriptionDetails component displays category information correctly
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestCategoryOrder() {
  console.log('🧪 Creating Test Category-Based Order\n');

  try {
    // Create a test order with category-based subscription
    const testOrder = {
      user_id: null, // No user for test
      email: 'test-category@example.com',
      total_amount: 699,
      original_amount: 699,
      coupon_code: null,
      discount_amount: 0,
      referral_code: null,
      referrer_id: null,
      items: [
        {
          id: "subscription-weekly-category-test",
          name: "Weekly Juice Plan",
          type: "subscription",
          image: "/images/subscription-icon.jpg",
          price: 699,
          quantity: 1,
          juiceName: "Weekly Juice Plan",
          subscriptionData: {
            planId: "weekly-juice",
            planName: "Weekly Juice Plan",
            basePrice: 699,
            planFrequency: "weekly",
            selectedCategory: "Fruit Blast",
            selectedJuices: [], // Empty for category-based
            selectedFruitBowls: [],
            subscriptionDuration: 2,
            categoryDistribution: [
              { day: 1, juiceName: "Rejoice" },
              { day: 2, juiceName: "Berry Bliss" },
              { day: 3, juiceName: "Citrus Zing" },
              { day: 4, juiceName: "Rejoice" },
              { day: 5, juiceName: "Berry Bliss" },
              { day: 6, juiceName: "Citrus Zing" }
            ]
          }
        }
      ],
      shipping_address: {
        firstName: "Test",
        lastName: "Category",
        email: "test-category@example.com",
        mobileNumber: "1234567890",
        address: "123 Test Street",
        city: "Test City",
        state: "Test State",
        pincode: "123456"
      },
      status: 'completed',
      order_type: 'subscription',
      subscription_info: {
        subscriptionItems: [
          {
            id: "subscription-weekly-category-test",
            name: "Weekly Juice Plan",
            type: "subscription",
            image: "/images/subscription-icon.jpg",
            price: 699,
            quantity: 1,
            juiceName: "Weekly Juice Plan",
            subscriptionData: {
              planId: "weekly-juice",
              planName: "Weekly Juice Plan",
              basePrice: 699,
              planFrequency: "weekly",
              selectedCategory: "Fruit Blast",
              selectedJuices: [], // Empty for category-based
              selectedFruitBowls: [],
              subscriptionDuration: 2,
              categoryDistribution: [
                { day: 1, juiceName: "Rejoice" },
                { day: 2, juiceName: "Berry Bliss" },
                { day: 3, juiceName: "Citrus Zing" },
                { day: 4, juiceName: "Rejoice" },
                { day: 5, juiceName: "Berry Bliss" },
                { day: 6, juiceName: "Citrus Zing" }
              ]
            }
          }
        ],
        hasSubscriptionItems: true
      },
      first_delivery_date: new Date().toISOString(),
      is_after_cutoff: false,
      delivery_schedule: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        deliveryDates: [
          new Date().toISOString(),
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        ],
        totalDeliveries: 2
      }
    };

    console.log('📝 Inserting test order...');
    const { data, error } = await supabase
      .from('orders')
      .insert([testOrder])
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating test order:', error);
      return;
    }

    console.log('✅ Test order created successfully!');
    console.log(`Order ID: ${data.id}`);
    console.log('\n📋 Order Details:');
    console.log('- Plan: Weekly Juice Plan');
    console.log('- Category: Fruit Blast');
    console.log('- Type: Category-Based Selection');
    console.log('- Status: completed');
    console.log('- Total Amount: ₹699');
    console.log('\n🔍 You can now check this order in the admin panel to see the category information displayed correctly.');

    // Verify the order was created correctly
    console.log('\n🔍 Verifying order data...');
    const { data: verifyOrder, error: verifyError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', data.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying order:', verifyError);
    } else {
      console.log('✅ Order verification successful');
      console.log('Subscription info structure:', JSON.stringify(verifyOrder.subscription_info, null, 2));
    }

  } catch (error) {
    console.error('❌ Error in test order creation:', error);
  }
}

// Run the function
createTestCategoryOrder().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
}); 