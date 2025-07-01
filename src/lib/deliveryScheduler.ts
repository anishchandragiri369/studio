/**
 * Delivery Scheduling System
 * 
 * Business Rules:
 * - Orders placed before 6 PM: Start delivery from next day
 * - Orders placed after 6 PM: Start delivery from day after next
 * - Daily subscriptions: Deliver every day except Sunday
 * - Weekly/Monthly subscriptions: Deliver every other day (1-day gap) except Sunday
 * - No deliveries on Sundays for any subscription type
 */

export interface DeliverySchedule {
  firstDeliveryDate: Date;
  nextDeliveryDate: Date;
  orderCutoffTime: Date;
  isAfterCutoff: boolean;
}

export interface SubscriptionDeliveryDates {
  startDate: Date;
  endDate: Date;
  deliveryDates: Date[];
  totalDeliveries: number;
}

/**
 * Calculate the first delivery date based on order time and 6 PM cutoff
 */
export function calculateFirstDeliveryDate(orderTime: Date = new Date()): DeliverySchedule {
  const cutoffHour = 18; // 6 PM in 24-hour format
  
  // Create cutoff time for today
  const cutoffTime = new Date(orderTime);
  cutoffTime.setHours(cutoffHour, 0, 0, 0);
  
  const isAfterCutoff = orderTime.getTime() >= cutoffTime.getTime();
  
  // Calculate first delivery date
  const firstDeliveryDate = new Date(orderTime);
  firstDeliveryDate.setHours(0, 0, 0, 0); // Reset to start of day
  
  if (isAfterCutoff) {
    // If after 6 PM, deliver day after tomorrow
    firstDeliveryDate.setDate(firstDeliveryDate.getDate() + 2);
  } else {
    // If before 6 PM, deliver tomorrow
    firstDeliveryDate.setDate(firstDeliveryDate.getDate() + 1);
  }
  
  // Skip Sunday if the calculated date falls on Sunday
  const finalDeliveryDate = skipSunday(firstDeliveryDate);
  
  return {
    firstDeliveryDate: finalDeliveryDate,
    nextDeliveryDate: finalDeliveryDate,
    orderCutoffTime: cutoffTime,
    isAfterCutoff
  };
}

/**
 * Generate all delivery dates for a subscription period
 * - Daily subscriptions: deliver every day except Sunday
 * - Weekly/Monthly subscriptions: deliver every other day (1-day gap) except Sunday
 */
export function generateSubscriptionDeliveryDates(
  frequency: 'daily' | 'weekly' | 'monthly',
  duration: number, // duration in months for subscriptions
  startDate: Date
): SubscriptionDeliveryDates {
  const deliveryDates: Date[] = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  let totalDeliveries = 0;
  let endDate = new Date(startDate);
  
  if (frequency === 'daily') {
    // For daily subscriptions: deliver EVERY day except Sunday (no gap)
    // Duration is in months, so calculate end date first
    endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + duration);
    
    let deliveryDate = new Date(currentDate);
    
    // Generate delivery dates daily, skipping only Sundays
    while (deliveryDate <= endDate) {
      // Skip Sundays (0 = Sunday)
      if (deliveryDate.getDay() !== 0) {
        deliveryDates.push(new Date(deliveryDate));
        totalDeliveries++;
      }
      
      // Move to next day (daily delivery)
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    }
  } else if (frequency === 'weekly') {
    // For weekly subscriptions: deliver with 1-day gap (every other day) except Sunday
    // Duration is in months, so calculate end date first
    endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + duration);
    
    let deliveryDate = new Date(currentDate);
    
    // Generate delivery dates with 1-day gap, skipping Sundays
    while (deliveryDate <= endDate) {
      // Skip Sundays (0 = Sunday)
      if (deliveryDate.getDay() !== 0) {
        deliveryDates.push(new Date(deliveryDate));
        totalDeliveries++;
        
        // Add 2 days for the gap (deliver every other day)
        deliveryDate.setDate(deliveryDate.getDate() + 2);
      } else {
        // If it's Sunday, move to Monday and continue
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }
    }
  } else if (frequency === 'monthly') {
    // For monthly subscriptions: deliver with 1-day gap (every other day) except Sunday
    // Duration is in months, so calculate end date first
    endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + duration);
    
    let deliveryDate = new Date(currentDate);
    
    // Generate delivery dates with 1-day gap, skipping Sundays
    while (deliveryDate <= endDate) {
      // Skip Sundays (0 = Sunday)
      if (deliveryDate.getDay() !== 0) {
        deliveryDates.push(new Date(deliveryDate));
        totalDeliveries++;
        
        // Add 2 days for the gap (deliver every other day)
        deliveryDate.setDate(deliveryDate.getDate() + 2);
      } else {
        // If it's Sunday, move to Monday and continue
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }
    }
  }
  
  return {
    startDate: new Date(startDate),
    endDate,
    deliveryDates,
    totalDeliveries
  };
}

/**
 * Get delivery dates for a specific date range (for reports)
 */
export function getDeliveryDatesForDateRange(
  subscriptionDeliveryDates: SubscriptionDeliveryDates,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  return subscriptionDeliveryDates.deliveryDates.filter(date => {
    const deliveryTime = date.getTime();
    const rangeStartTime = rangeStart.getTime();
    const rangeEndTime = rangeEnd.getTime();
    
    return deliveryTime >= rangeStartTime && deliveryTime <= rangeEndTime;
  });
}

/**
 * Format date for display in reports
 */
export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Check if delivery is scheduled for today
 */
export function isDeliveryToday(deliveryDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  
  return today.getTime() === delivery.getTime();
}

/**
 * Check if delivery is scheduled for tomorrow
 */
export function isDeliveryTomorrow(deliveryDate: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const delivery = new Date(deliveryDate);
  delivery.setHours(0, 0, 0, 0);
  
  return tomorrow.getTime() === delivery.getTime();
}

/**
 * Utility function to skip Sundays - if date is Sunday, move to Monday
 */
export function skipSunday(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  
  // If it's Sunday (0), move to Monday (1)
  if (result.getDay() === 0) {
    result.setDate(result.getDate() + 1);
  }
  
  return result;
}

/**
 * Get the next delivery date (excluding Sundays)
 */
export function getNextDeliveryDateExcludingSunday(fromDate: Date): Date {
  const nextDate = new Date(fromDate);
  nextDate.setDate(nextDate.getDate() + 1);
  return skipSunday(nextDate);
}

/**
 * Get next upcoming delivery date from a list of delivery dates
 */
export function getNextDeliveryDate(deliveryDates: Date[]): Date | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const upcomingDeliveries = deliveryDates
    .filter(date => {
      const deliveryTime = new Date(date);
      deliveryTime.setHours(0, 0, 0, 0);
      return deliveryTime.getTime() >= now.getTime();
    })
    .sort((a, b) => a.getTime() - b.getTime());
  
  return upcomingDeliveries.length > 0 ? upcomingDeliveries[0] : null;
}
