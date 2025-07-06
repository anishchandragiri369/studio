import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DeliveryScheduleSetting {
  subscription_type: string;
  delivery_gap_days: number;
  is_daily: boolean;
  description: string;
  is_active: boolean;
}

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

// Cache for delivery settings to avoid frequent DB calls
let settingsCache: DeliveryScheduleSetting[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get delivery schedule settings from database with caching
 */
async function getDeliveryScheduleSettings(): Promise<DeliveryScheduleSetting[]> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (settingsCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }
  
  try {
    const { data, error } = await supabase
      .from('delivery_schedule_settings')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    settingsCache = data as DeliveryScheduleSetting[];
    cacheTimestamp = now;
    return settingsCache;
  } catch (error) {
    console.error('Error fetching delivery schedule settings:', error);
    // Return default settings if DB call fails
    return [
      { subscription_type: 'juices', delivery_gap_days: 1, is_daily: false, description: 'Every other day delivery', is_active: true },
      { subscription_type: 'fruit_bowls', delivery_gap_days: 1, is_daily: true, description: 'Daily delivery', is_active: true },
      { subscription_type: 'customized', delivery_gap_days: 2, is_daily: false, description: 'Every 3 days', is_active: true }
    ];
  }
}

/**
 * Get delivery gap for a specific subscription type
 */
async function getDeliveryGapForSubscriptionType(subscriptionType: string): Promise<{ gapDays: number; isDaily: boolean }> {
  const settings = await getDeliveryScheduleSettings();
  const setting = settings.find(s => s.subscription_type === subscriptionType && s.is_active);
  
  if (setting) {
    return {
      gapDays: setting.delivery_gap_days,
      isDaily: setting.is_daily
    };
  }
  
  // Default fallback
  return {
    gapDays: subscriptionType === 'fruit_bowls' ? 1 : 3,
    isDaily: subscriptionType === 'fruit_bowls'
  };
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
 * Generate all delivery dates for a subscription period using database settings
 */
export async function generateSubscriptionDeliveryDatesWithSettings(
  subscriptionType: string,
  duration: number, // duration in months for subscriptions
  startDate: Date
): Promise<SubscriptionDeliveryDates> {
  const { gapDays, isDaily } = await getDeliveryGapForSubscriptionType(subscriptionType);
  
  const deliveryDates: Date[] = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  let totalDeliveries = 0;
  const endDate = new Date(currentDate);
  endDate.setMonth(endDate.getMonth() + duration);
  
  let deliveryDate = new Date(currentDate);
  
  // Generate delivery dates based on settings
  while (deliveryDate <= endDate) {
    // Skip Sundays (0 = Sunday)
    if (deliveryDate.getDay() !== 0) {
      deliveryDates.push(new Date(deliveryDate));
      totalDeliveries++;
      
      if (isDaily) {
        // Move to next day for daily delivery
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      } else {
        // Move by gap days + 1 (so gap of 1 means every other day)
        deliveryDate.setDate(deliveryDate.getDate() + gapDays + 1);
      }
    } else {
      // If it's Sunday, move to Monday and continue
      deliveryDate.setDate(deliveryDate.getDate() + 1);
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
 * Generate all delivery dates for a subscription period (legacy function for backward compatibility)
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
    endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + duration);
    
    let deliveryDate = new Date(currentDate);
    
    while (deliveryDate <= endDate) {
      if (deliveryDate.getDay() !== 0) {
        deliveryDates.push(new Date(deliveryDate));
        totalDeliveries++;
      }
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    }
  } else if (frequency === 'weekly' || frequency === 'monthly') {
    // For weekly/monthly subscriptions: deliver with 1-day gap (every other day) except Sunday
    endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + duration);
    
    let deliveryDate = new Date(currentDate);
    
    while (deliveryDate <= endDate) {
      if (deliveryDate.getDay() !== 0) {
        deliveryDates.push(new Date(deliveryDate));
        totalDeliveries++;
        deliveryDate.setDate(deliveryDate.getDate() + 2);
      } else {
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
 * Calculate next delivery date for an existing subscription using database settings
 */
export async function calculateNextDeliveryDateWithSettings(
  subscriptionType: string,
  currentDeliveryDate: Date
): Promise<Date> {
  const { gapDays, isDaily } = await getDeliveryGapForSubscriptionType(subscriptionType);
  
  const nextDate = new Date(currentDeliveryDate);
  
  if (isDaily) {
    // Move to next day for daily delivery
    nextDate.setDate(nextDate.getDate() + 1);
  } else {
    // Move by gap days + 1 (so gap of 1 means every other day)
    nextDate.setDate(nextDate.getDate() + gapDays + 1);
  }
  
  // Skip Sunday if needed
  return skipSunday(nextDate);
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

/**
 * Get delivery schedule preview for admin interface
 */
export async function getDeliverySchedulePreview(
  subscriptionType: string,
  startDate: Date,
  previewDays: number = 14
): Promise<{ dates: Date[]; schedule: string }> {
  const { gapDays, isDaily } = await getDeliveryGapForSubscriptionType(subscriptionType);
  
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  let daysGenerated = 0;
  
  while (daysGenerated < previewDays) {
    // Skip Sundays
    if (currentDate.getDay() !== 0) {
      dates.push(new Date(currentDate));
      daysGenerated++;
      
      if (isDaily) {
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + gapDays + 1);
      }
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  const schedule = isDaily ? 'Daily delivery' : `Every ${gapDays + 1} days`;
  
  return { dates, schedule };
}

/**
 * Clear the settings cache (useful when settings are updated)
 */
export function clearDeliverySettingsCache(): void {
  settingsCache = [];
  cacheTimestamp = 0;
}
