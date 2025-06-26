// Test script to verify the alternate day delivery schedule
const { SubscriptionManager } = require('./src/lib/subscriptionManager.ts');

// Test the alternate day pattern
console.log('Testing Alternate Day Delivery Schedule (Excluding Sundays)');
console.log('='.repeat(60));

// Test starting from different days of the week
const testDates = [
  new Date('2025-06-25'), // Wednesday (today)
  new Date('2025-06-26'), // Thursday
  new Date('2025-06-27'), // Friday
  new Date('2025-06-28'), // Saturday
  new Date('2025-06-29'), // Sunday
  new Date('2025-06-30'), // Monday
];

testDates.forEach(startDate => {
  console.log(`\nStarting from: ${startDate.toDateString()} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][startDate.getDay()]})`);
  
  // Get next 7 deliveries
  const deliveries = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const nextDelivery = SubscriptionManager.getNextScheduledDelivery(currentDate, 'monthly', currentDate);
    deliveries.push(nextDelivery);
    currentDate = nextDelivery;
  }
  
  deliveries.forEach((delivery, index) => {
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][delivery.getDay()];
    console.log(`  ${index + 1}. ${delivery.toDateString()} (${dayName})`);
  });
  
  // Verify no Sundays and proper spacing
  const hasSundays = deliveries.some(d => d.getDay() === 0);
  console.log(`  ✓ No Sundays: ${!hasSundays ? 'PASS' : 'FAIL'}`);
});

// Test monthly schedule generation
console.log('\n\nTesting Monthly Schedule Generation');
console.log('='.repeat(40));

const monthlyStart = new Date('2025-07-01'); // July 1st (Tuesday)
const monthlyDeliveries = SubscriptionManager.generateMonthlyDeliverySchedule(monthlyStart, 1);

console.log(`Generated ${monthlyDeliveries.length} deliveries for July 2025:`);
monthlyDeliveries.forEach((delivery, index) => {
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][delivery.getDay()];
  console.log(`  ${index + 1}. ${delivery.toDateString()} (${dayName})`);
});

// Verify pattern
const hasSundaysInMonth = monthlyDeliveries.some(d => d.getDay() === 0);
console.log(`\n✓ No Sundays in monthly schedule: ${!hasSundaysInMonth ? 'PASS' : 'FAIL'}`);

// Check spacing (should be mostly 2-day gaps)
let spacingCheck = true;
for (let i = 1; i < monthlyDeliveries.length; i++) {
  const prevDate = monthlyDeliveries[i - 1];
  const currDate = monthlyDeliveries[i];
  const daysDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
  
  // Allow 2-3 days gap (3 days when skipping Sunday)
  if (daysDiff < 2 || daysDiff > 3) {
    spacingCheck = false;
    console.log(`  ⚠️  Unexpected gap: ${daysDiff} days between ${prevDate.toDateString()} and ${currDate.toDateString()}`);
  }
}

console.log(`✓ Proper alternate day spacing: ${spacingCheck ? 'PASS' : 'FAIL'}`);
