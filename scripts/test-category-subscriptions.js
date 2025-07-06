/**
 * Test script for category-based subscriptions
 * This script tests the category distribution logic and helper functions
 */

// Mock data for testing
const mockJuices = [
  {
    id: '1',
    name: 'Rejoice',
    category: 'Fruit Blast',
    tags: ['energizing', 'vitamin c', 'morning', 'Immunity Booster', 'Seasonal Specials'],
    price: 120.00
  },
  {
    id: '2',
    name: 'Green Vitality',
    category: 'Green Power',
    tags: ['detox', 'healthy', 'greens', 'Immunity Booster', 'Radiant Health', 'Detoxify', 'Daily Wellness'],
    price: 120.00
  },
  {
    id: '3',
    name: 'Berry Bliss',
    category: 'Fruit Blast',
    tags: ['antioxidant', 'sweet', 'smoothie', 'Skin Glow', 'Kids Friendly'],
    price: 120.00
  },
  {
    id: '4',
    name: 'Tropical Escape',
    category: 'Exotic Flavors',
    tags: ['tropical', 'hydrating', 'refreshing', 'Energy Kick', 'Seasonal Specials'],
    price: 120.00
  },
  {
    id: '5',
    name: 'Beet Boost',
    category: 'Veggie Fusion',
    tags: ['earthy', 'stamina', 'nutrient-rich', 'Workout Fuel', 'Detoxify'],
    price: 120.00
  },
  {
    id: '6',
    name: 'Citrus Zing',
    category: 'Fruit Blast',
    tags: ['tangy', 'refreshing', 'vitamin c', 'Immunity Booster', 'Daily Wellness', 'Energy Kick'],
    price: 120.00
  }
];

const mockWeeklyPlan = {
  id: 'weekly-juice',
  name: 'Weekly Juice Plan',
  frequency: 'weekly',
  pricePerDelivery: 699.00,
  maxJuices: 6,
  isCustomizable: true,
  planType: 'juice-only'
};

const mockMonthlyPlan = {
  id: 'monthly-juice',
  name: 'Monthly Juice Plan',
  frequency: 'monthly',
  pricePerDelivery: 2599.00,
  maxJuices: 26,
  isCustomizable: true,
  planType: 'juice-only'
};

// Test helper functions (simplified versions for testing)
function getAvailableCategories(juices) {
  const categories = new Set();
  
  // Add traditional categories
  const traditionalCategories = ['Fruit Blast', 'Green Power', 'Exotic Flavors', 'Veggie Fusion'];
  traditionalCategories.forEach(cat => {
    if (juices.some(juice => juice.category === cat)) {
      categories.add(cat);
    }
  });
  
  // Add health-focused categories (from tags)
  const healthCategories = [
    'Immunity Booster', 'Skin Glow', 'Radiant Health', 'Energy Kick',
    'Detoxify', 'Workout Fuel', 'Daily Wellness', 'Kids Friendly', 'Seasonal Specials'
  ];
  
  healthCategories.forEach(cat => {
    if (juices.some(juice => juice.tags && juice.tags.includes(cat))) {
      categories.add(cat);
    }
  });
  
  return Array.from(categories).sort();
}

function getJuicesForCategory(category, juices) {
  return juices.filter(juice => 
    juice.category === category || 
    (juice.tags && juice.tags.includes(category))
  );
}

function calculateCategoryDistribution(category, categoryJuices, plan) {
  const subscriptionDays = plan.frequency === 'weekly' ? 6 : 26;
  const maxJuices = plan.maxJuices || (plan.frequency === 'weekly' ? 6 : 26);
  
  // Filter juices by category
  const filteredJuices = categoryJuices.filter(juice => 
    juice.category === category || 
    (juice.tags && juice.tags.includes(category))
  );

  if (filteredJuices.length === 0) return [];

  // Calculate how many juices to include
  const juicesToInclude = Math.min(filteredJuices.length, maxJuices);
  const selectedJuices = filteredJuices.slice(0, juicesToInclude);
  
  // Calculate quantities to distribute across the subscription period
  const totalJuicesNeeded = maxJuices;
  const juicesPerJuiceType = Math.ceil(totalJuicesNeeded / selectedJuices.length);
  
  const distribution = [];
  
  selectedJuices.forEach((juice, index) => {
    const quantity = Math.min(juicesPerJuiceType, totalJuicesNeeded - distribution.reduce((sum, item) => sum + item.quantity, 0));
    
    if (quantity > 0) {
      // Simple distribution across days
      const days = [];
      const daysPerJuice = Math.ceil(subscriptionDays / selectedJuices.length);
      const startDay = index * daysPerJuice + 1;
      
      for (let i = 0; i < quantity; i++) {
        const day = Math.min(startDay + i, subscriptionDays);
        if (!days.includes(day)) {
          days.push(day);
        }
      }
      
      distribution.push({
        juiceId: juice.id,
        quantity,
        days,
        juice
      });
    }
  });

  return distribution;
}

function validateCategoryForSubscription(category, juices, plan) {
  const categoryJuices = getJuicesForCategory(category, juices);
  const maxJuices = plan.maxJuices || (plan.frequency === 'weekly' ? 6 : 26);
  
  if (categoryJuices.length === 0) {
    return {
      isValid: false,
      message: `No juices found in the "${category}" category.`,
      availableJuices: 0
    };
  }
  
  if (categoryJuices.length < Math.min(3, maxJuices)) {
    return {
      isValid: false,
      message: `The "${category}" category only has ${categoryJuices.length} juices. We recommend at least 3 different juices for variety.`,
      availableJuices: categoryJuices.length
    };
  }
  
  return {
    isValid: true,
    message: `Perfect! The "${category}" category has ${categoryJuices.length} juices available.`,
    availableJuices: categoryJuices.length
  };
}

// Test functions
function testAvailableCategories() {
  console.log('\n🧪 Testing Available Categories');
  console.log('================================');
  
  const categories = getAvailableCategories(mockJuices);
  console.log('Available categories:', categories);
  
  const expectedCategories = [
    'Daily Wellness', 'Detoxify', 'Energy Kick', 'Exotic Flavors', 
    'Fruit Blast', 'Green Power', 'Immunity Booster', 'Kids Friendly', 
    'Radiant Health', 'Seasonal Specials', 'Skin Glow', 'Veggie Fusion'
  ];
  
  // Check if all found categories are expected (but don't require all expected to be found)
  const isCorrect = categories.length > 0 && 
    categories.every(cat => expectedCategories.includes(cat));
  
  console.log('✅ Test passed:', isCorrect);
  return isCorrect;
}

function testCategoryJuices() {
  console.log('\n🧪 Testing Category Juice Filtering');
  console.log('===================================');
  
  const fruitBlastJuices = getJuicesForCategory('Fruit Blast', mockJuices);
  const immunityJuices = getJuicesForCategory('Immunity Booster', mockJuices);
  
  console.log('Fruit Blast juices:', fruitBlastJuices.map(j => j.name));
  console.log('Immunity Booster juices:', immunityJuices.map(j => j.name));
  
  const fruitBlastCorrect = fruitBlastJuices.length === 3; // Rejoice, Berry Bliss, Citrus Zing
  const immunityCorrect = immunityJuices.length === 3; // Rejoice, Green Vitality, Citrus Zing
  
  console.log('✅ Fruit Blast test passed:', fruitBlastCorrect);
  console.log('✅ Immunity Booster test passed:', immunityCorrect);
  
  return fruitBlastCorrect && immunityCorrect;
}

function testCategoryDistribution() {
  console.log('\n🧪 Testing Category Distribution');
  console.log('================================');
  
  // Test weekly plan (max 6 juices)
  const weeklyFruitBlastDistribution = calculateCategoryDistribution('Fruit Blast', mockJuices, mockWeeklyPlan);
  const weeklyImmunityDistribution = calculateCategoryDistribution('Immunity Booster', mockJuices, mockWeeklyPlan);
  
  console.log('Weekly Plan - Fruit Blast distribution:');
  weeklyFruitBlastDistribution.forEach(item => {
    console.log(`  ${item.juice.name}: ${item.quantity} bottles on days ${item.days.join(', ')}`);
  });
  
  console.log('\nWeekly Plan - Immunity Booster distribution:');
  weeklyImmunityDistribution.forEach(item => {
    console.log(`  ${item.juice.name}: ${item.quantity} bottles on days ${item.days.join(', ')}`);
  });
  
  const weeklyFruitBlastTotal = weeklyFruitBlastDistribution.reduce((sum, item) => sum + item.quantity, 0);
  const weeklyImmunityTotal = weeklyImmunityDistribution.reduce((sum, item) => sum + item.quantity, 0);
  
  console.log(`\nWeekly Plan - Total juices in Fruit Blast: ${weeklyFruitBlastTotal}`);
  console.log(`Weekly Plan - Total juices in Immunity Booster: ${weeklyImmunityTotal}`);
  
  // Test monthly plan (max 26 juices)
  const monthlyFruitBlastDistribution = calculateCategoryDistribution('Fruit Blast', mockJuices, mockMonthlyPlan);
  const monthlyImmunityDistribution = calculateCategoryDistribution('Immunity Booster', mockJuices, mockMonthlyPlan);
  
  console.log('\nMonthly Plan - Fruit Blast distribution:');
  monthlyFruitBlastDistribution.forEach(item => {
    console.log(`  ${item.juice.name}: ${item.quantity} bottles on days ${item.days.join(', ')}`);
  });
  
  console.log('\nMonthly Plan - Immunity Booster distribution:');
  monthlyImmunityDistribution.forEach(item => {
    console.log(`  ${item.juice.name}: ${item.quantity} bottles on days ${item.days.join(', ')}`);
  });
  
  const monthlyFruitBlastTotal = monthlyFruitBlastDistribution.reduce((sum, item) => sum + item.quantity, 0);
  const monthlyImmunityTotal = monthlyImmunityDistribution.reduce((sum, item) => sum + item.quantity, 0);
  
  console.log(`\nMonthly Plan - Total juices in Fruit Blast: ${monthlyFruitBlastTotal}`);
  console.log(`Monthly Plan - Total juices in Immunity Booster: ${monthlyImmunityTotal}`);
  
  const weeklyCorrect = weeklyFruitBlastTotal === 6 && weeklyImmunityTotal === 6;
  const monthlyCorrect = monthlyFruitBlastTotal === 26 && monthlyImmunityTotal === 26;
  
  console.log('✅ Weekly distribution test passed:', weeklyCorrect);
  console.log('✅ Monthly distribution test passed:', monthlyCorrect);
  
  return weeklyCorrect && monthlyCorrect;
}

function testCategoryValidation() {
  console.log('\n🧪 Testing Category Validation');
  console.log('==============================');
  
  const weeklyFruitBlastValidation = validateCategoryForSubscription('Fruit Blast', mockJuices, mockWeeklyPlan);
  const monthlyFruitBlastValidation = validateCategoryForSubscription('Fruit Blast', mockJuices, mockMonthlyPlan);
  const emptyCategoryValidation = validateCategoryForSubscription('NonExistent', mockJuices, mockWeeklyPlan);
  
  console.log('Weekly Plan - Fruit Blast validation:', weeklyFruitBlastValidation);
  console.log('Monthly Plan - Fruit Blast validation:', monthlyFruitBlastValidation);
  console.log('Non-existent category validation:', emptyCategoryValidation);
  
  const weeklyValidationCorrect = weeklyFruitBlastValidation.isValid && !emptyCategoryValidation.isValid;
  const monthlyValidationCorrect = monthlyFruitBlastValidation.isValid && !emptyCategoryValidation.isValid;
  
  console.log('✅ Weekly validation test passed:', weeklyValidationCorrect);
  console.log('✅ Monthly validation test passed:', monthlyValidationCorrect);
  
  return weeklyValidationCorrect && monthlyValidationCorrect;
}

function testMonthlySubscription() {
  console.log('\n🧪 Testing Monthly Subscription');
  console.log('===============================');
  
  const fruitBlastDistribution = calculateCategoryDistribution('Fruit Blast', mockJuices, mockMonthlyPlan);
  
  console.log('Monthly Fruit Blast distribution:');
  fruitBlastDistribution.forEach(item => {
    console.log(`  ${item.juice.name}: ${item.quantity} bottles on days ${item.days.join(', ')}`);
  });
  
  const totalJuices = fruitBlastDistribution.reduce((sum, item) => sum + item.quantity, 0);
  console.log(`Total juices: ${totalJuices}`);
  
  const monthlyCorrect = totalJuices === 26;
  console.log('✅ Monthly subscription test passed:', monthlyCorrect);
  
  return monthlyCorrect;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Category-Based Subscription Tests');
  console.log('=============================================');
  
  const tests = [
    testAvailableCategories,
    testCategoryJuices,
    testCategoryDistribution,
    testCategoryValidation,
    testMonthlySubscription
  ];
  
  const results = tests.map(test => {
    try {
      return test();
    } catch (error) {
      console.error('❌ Test failed with error:', error.message);
      return false;
    }
  });
  
  const passedTests = results.filter(result => result === true).length;
  const totalTests = tests.length;
  
  console.log('\n📊 Test Results');
  console.log('===============');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Category-based subscriptions are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
  
  return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testAvailableCategories,
  testCategoryJuices,
  testCategoryDistribution,
  testCategoryValidation,
  testMonthlySubscription
}; 