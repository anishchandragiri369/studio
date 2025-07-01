// Subscription utility functions
export interface SubscriptionData {
  plan: string;
  duration: number;
  items: { id: number; name: string; price: number }[];
  startDate: Date;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface Subscription {
  id: string;
  plan: string;
  status: string;
  startDate: Date;
  endDate: Date;
  lastDelivery?: Date;
  isActive: boolean;
}

// Validate subscription data
export function validateSubscriptionData(data: SubscriptionData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate plan
  const validPlans = ['daily', 'weekly', 'monthly'];
  if (!validPlans.includes(data.plan)) {
    errors.push('Invalid subscription plan');
  }
  
  // Validate duration
  if (!data.duration || data.duration < 7) {
    errors.push('Duration must be at least 7 days');
  }
  
  // Validate items
  if (!Array.isArray(data.items) || data.items.length === 0) {
    errors.push('Subscription must contain at least one item');
  }
  
  // Validate start date
  if (!data.startDate || isNaN(data.startDate.getTime())) {
    errors.push('Valid start date is required');
  } else if (data.startDate < new Date()) {
    errors.push('Start date cannot be in the past');
  }
  
  // Validate customer
  if (!data.customer || !data.customer.name || !data.customer.email) {
    errors.push('Customer information is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Calculate next delivery date based on plan
export function calculateNextDeliveryDate(subscription: Subscription): Date {
  const lastDelivery = subscription.lastDelivery || subscription.startDate;
  const nextDate = new Date(lastDelivery);
  
  switch (subscription.plan) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 1);
  }
  
  // Skip weekends for daily plans
  if (subscription.plan === 'daily') {
    while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
  }
  
  return nextDate;
}

// Get subscription status
export function getSubscriptionStatus(subscription: Subscription): string {
  const now = new Date();
  
  if (!subscription.isActive) {
    return 'cancelled';
  }
  
  if (subscription.endDate < now) {
    return 'expired';
  }
  
  if (subscription.startDate > now) {
    return 'upcoming';
  }
  
  return 'active';
}

// Calculate subscription pricing with discounts
export function calculateSubscriptionPricing(data: SubscriptionData): {
  dailyPrice: number;
  totalPrice: number;
  discountPercent: number;
  savings: number;
} {
  const dailyPrice = data.items.reduce((sum, item) => sum + item.price, 0);
  const baseTotal = dailyPrice * data.duration;
  
  let discountPercent = 0;
  
  // Apply discounts based on duration
  if (data.duration >= 90) {
    discountPercent = 20; // 20% for 3+ months
  } else if (data.duration >= 60) {
    discountPercent = 15; // 15% for 2+ months
  } else if (data.duration >= 30) {
    discountPercent = 10; // 10% for 1+ month
  }
  
  const savings = (baseTotal * discountPercent) / 100;
  const totalPrice = baseTotal - savings;
  
  return {
    dailyPrice,
    totalPrice: Math.round(totalPrice),
    discountPercent,
    savings: Math.round(savings)
  };
}

// Check if subscription can be modified
export function canModifySubscription(subscription: Subscription): boolean {
  const now = new Date();
  const nextDelivery = calculateNextDeliveryDate(subscription);
  const hoursUntilDelivery = (nextDelivery.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Can modify if next delivery is more than 12 hours away
  return hoursUntilDelivery > 12;
}

// Generate subscription schedule
export function generateSubscriptionSchedule(subscription: Subscription, days: number = 30): Date[] {
  const schedule: Date[] = [];
  const startDate = subscription.lastDelivery || subscription.startDate;
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    currentDate = calculateNextDeliveryDate({
      ...subscription,
      lastDelivery: currentDate
    });
    
    if (currentDate > subscription.endDate) break;
    
    schedule.push(new Date(currentDate));
  }
  
  return schedule;
}
