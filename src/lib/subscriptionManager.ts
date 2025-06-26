// Subscription management utilities
import type { SubscriptionDurationOption } from './types';
import { SUBSCRIPTION_DURATION_OPTIONS, WEEKLY_SUBSCRIPTION_DURATION_OPTIONS, RENEWAL_NOTIFICATION_DAYS } from './constants';

export class SubscriptionManager {
  
  /**
   * Check if a subscription can be paused (24 hours notice required)
   */
  static canPauseSubscription(nextDeliveryDate: string): { canPause: boolean; reason?: string } {
    const now = new Date();
    const deliveryDate = new Date(nextDeliveryDate);
    const hoursUntilDelivery = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDelivery < 24) {
      const hoursRemaining = Math.round(hoursUntilDelivery);
      if (hoursRemaining <= 0) {
        return {
          canPause: false,
          reason: `Cannot pause subscription. Next delivery is overdue or happening today. You can pause after the delivery.`
        };
      } else {
        return {
          canPause: false,
          reason: `Cannot pause subscription. Next delivery is in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}. Minimum 24 hours notice required.`
        };
      }
    }
    
    return { canPause: true };
  }

  /**
   * Check if a paused subscription can be reactivated (within 3 months)
   */
  static canReactivateSubscription(pauseDate: string): { canReactivate: boolean; reason?: string; daysLeft?: number } {
    const now = new Date();
    const paused = new Date(pauseDate);
    const reactivationDeadline = new Date(paused);
    reactivationDeadline.setMonth(reactivationDeadline.getMonth() + 3);
    
    const daysLeft = Math.ceil((reactivationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return {
        canReactivate: false,
        reason: 'Reactivation period has expired. Please create a new subscription.',
        daysLeft: 0
      };
    }
    
    return { 
      canReactivate: true, 
      daysLeft 
    };
  }

  /**
   * Calculate next delivery date based on frequency
   */
  static calculateNextDeliveryDate(currentDate: Date, frequency: 'weekly' | 'monthly'): Date {
    if (frequency === 'weekly') {
      return this.calculateNextWeeklyDelivery(currentDate);
    } else {
      return this.calculateNextMonthlyDelivery(currentDate);
    }
  }

  /**
   * Calculate next weekly delivery date (skip Sundays)
   */
  private static calculateNextWeeklyDelivery(currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 7);
    
    // If it falls on Sunday (0), move to Monday
    if (nextDate.getDay() === 0) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    return nextDate;
  }  /**
   * Calculate next monthly delivery date with alternate day pattern (excluding Sundays)
   */
  private static calculateNextMonthlyDelivery(currentDate: Date): Date {
    const nextDate = new Date(currentDate);
    
    // Add 2 days to skip one day in between
    nextDate.setDate(nextDate.getDate() + 2);
    
    // If it falls on Sunday, move to Monday
    if (nextDate.getDay() === 0) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    return nextDate;
  }/**
   * Generate all delivery dates for a month with alternate day pattern (skip 1 day, exclude Sundays)
   */
  static generateMonthlyDeliverySchedule(startDate: Date, monthsCount: number = 1): Date[] {
    const deliveries: Date[] = [];
    let currentDate = new Date(startDate);
    
    // Calculate end date for the period
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + monthsCount);
    
    // Start from the first valid delivery date
    while (currentDate < endDate) {
      // Skip Sundays
      if (currentDate.getDay() !== 0) {
        deliveries.push(new Date(currentDate));
      }
      
      // Move to next delivery date (skip 1 day in between)
      currentDate.setDate(currentDate.getDate() + 2);
      
      // If we land on Sunday, move to Monday
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return deliveries;
  }

  /**
   * Calculate optimal delivery days within a month
   */
  private static calculateOptimalDeliveryDays(daysInMonth: number): number[] {
    const deliveriesPerMonth = 14;
    const spacing = Math.floor(daysInMonth / deliveriesPerMonth);
    const deliveryDays: number[] = [];
    
    // Start from day 3-5 to avoid beginning of month rush
    let currentDay = 4;
    
    for (let i = 0; i < deliveriesPerMonth && currentDay <= daysInMonth; i++) {
      deliveryDays.push(currentDay);
      currentDay += spacing;
      
      // Add some variation to avoid predictable patterns
      if (i % 2 === 1) {
        currentDay += 1; // Add extra day every other delivery
      }
    }
    
    // Ensure we don't exceed month boundaries
    return deliveryDays.filter(day => day <= daysInMonth);
  }

  /**
   * Skip Sundays and adjust delivery date
   */
  private static skipSundaysAndAdjust(date: Date): Date {
    const adjustedDate = new Date(date);
    
    // If it's Sunday (0), move to Monday
    if (adjustedDate.getDay() === 0) {
      adjustedDate.setDate(adjustedDate.getDate() + 1);
    }
    
    return adjustedDate;
  }
  /**
   * Get next delivery date from current date with daily scheduling
   */  static getNextScheduledDelivery(currentDate: Date, frequency: 'weekly' | 'monthly', lastDeliveryDate?: Date): Date {
    if (frequency === 'weekly') {
      return this.calculateNextWeeklyDelivery(lastDeliveryDate || currentDate);
    }
    
    // For monthly, use Mon/Wed/Fri pattern
    return this.calculateNextMonthlyDelivery(lastDeliveryDate || currentDate);
  }  /**
   * Check if a date is a valid delivery date (not Sunday, alternate day pattern for monthly)
   */
  static isValidDeliveryDate(date: Date, frequency: 'weekly' | 'monthly' = 'monthly'): boolean {
    const dayOfWeek = date.getDay();
    
    if (frequency === 'weekly') {
      return dayOfWeek !== 0; // Not Sunday for weekly
    }
    
    // For monthly: any day except Sunday (alternate day pattern handled in scheduling)
    return dayOfWeek !== 0;
  }

  /**
   * Calculate reactivation deadline (3 months from pause date)
   */
  static calculateReactivationDeadline(pauseDate: Date): Date {
    const deadline = new Date(pauseDate);
    deadline.setMonth(deadline.getMonth() + 3);
    return deadline;
  }

  /**
   * Format date for display
   */
  static formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get time until next delivery
   */
  static getTimeUntilDelivery(deliveryDate: string): string {
    const now = new Date();
    const delivery = new Date(deliveryDate);
    const diffMs = delivery.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Delivery is due';
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }

  /**
   * Check if subscription is expired
   */
  static isSubscriptionExpired(pauseDate: string): boolean {
    const { canReactivate } = this.canReactivateSubscription(pauseDate);
    return !canReactivate;
  }  /**
   * Calculate subscription pricing with discount
   */
  static calculateSubscriptionPricing(basePrice: number, durationMonths: 1 | 2 | 3 | 4 | 6 | 12, frequency: 'weekly' | 'monthly' = 'monthly'): {
    originalPrice: number;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    discountType: string;
  } {
    const durationOptions = frequency === 'weekly' ? WEEKLY_SUBSCRIPTION_DURATION_OPTIONS : SUBSCRIPTION_DURATION_OPTIONS;
    const durationOption = durationOptions.find(option => option.months === durationMonths);
    
    // For weekly subscriptions, use the weeks field if available, otherwise use months as weeks
    // For monthly subscriptions, use months as normal
    let multiplier: number;
    if (frequency === 'weekly') {
      multiplier = durationOption?.weeks || durationMonths; // Use actual weeks
    } else {
      multiplier = durationMonths; // Use months for monthly subscriptions
    }
    
    const originalPrice = basePrice * multiplier;
    
    if (!durationOption) {
      // For custom durations that don't have predefined discounts
      // Still apply some basic discount logic based on duration
      let discountPercentage = 0;
      let discountType = 'bronze';
      
      if (frequency === 'monthly') {
        // Apply discount logic for monthly subscriptions
        if (durationMonths >= 12) {
          discountPercentage = 20;
          discountType = 'platinum';
        } else if (durationMonths >= 6) {
          discountPercentage = 12;
          discountType = 'gold';
        } else if (durationMonths >= 4) {
          discountPercentage = 8;
          discountType = 'silver';
        } else if (durationMonths >= 3) {
          discountPercentage = 5;
          discountType = 'bronze';
        }
      } else {
        // Apply discount logic for weekly subscriptions
        if (durationMonths >= 3) {
          discountPercentage = 10;
          discountType = 'silver';
        } else if (durationMonths >= 2) {
          discountPercentage = 5;
          discountType = 'bronze';
        }
      }
      
      const discountAmount = (originalPrice * discountPercentage) / 100;
      const finalPrice = originalPrice - discountAmount;
      
      return {
        originalPrice,
        discountPercentage,
        discountAmount,
        finalPrice,
        discountType
      };
    }

    // Use predefined discount from the option
    const discountAmount = (originalPrice * durationOption.discountPercentage) / 100;
    const finalPrice = originalPrice - discountAmount;

    return {
      originalPrice,
      discountPercentage: durationOption.discountPercentage,
      discountAmount,
      finalPrice,
      discountType: durationOption.discountType
    };
  }

  /**
   * Calculate subscription end date
   */
  static calculateSubscriptionEndDate(startDate: Date, durationMonths: number): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    return endDate;
  }

  /**
   * Check if subscription needs renewal notification (within 5 days of expiry)
   */
  static needsRenewalNotification(subscriptionEndDate: string): { needsNotification: boolean; daysLeft: number } {
    const now = new Date();
    const endDate = new Date(subscriptionEndDate);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      needsNotification: daysLeft <= RENEWAL_NOTIFICATION_DAYS && daysLeft > 0,
      daysLeft: Math.max(0, daysLeft)
    };
  }

  /**
   * Check if subscription is about to expire or has expired
   */
  static getSubscriptionExpiryStatus(subscriptionEndDate: string): {
    status: 'active' | 'expiring_soon' | 'expired';
    daysLeft: number;
    message: string;
  } {
    const now = new Date();
    const endDate = new Date(subscriptionEndDate);
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return {
        status: 'expired',
        daysLeft: 0,
        message: 'Your subscription has expired. Please renew to continue receiving deliveries.'
      };
    } else if (daysLeft <= RENEWAL_NOTIFICATION_DAYS) {
      return {
        status: 'expiring_soon',
        daysLeft,
        message: `Your subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew now to avoid interruption.`
      };
    } else {
      return {
        status: 'active',
        daysLeft,
        message: `Your subscription is active for ${daysLeft} more days.`
      };
    }
  }
  /**
   * Get available duration options
   */
  static getDurationOptions(frequency: 'weekly' | 'monthly' = 'monthly'): SubscriptionDurationOption[] {
    return frequency === 'weekly' ? WEEKLY_SUBSCRIPTION_DURATION_OPTIONS : SUBSCRIPTION_DURATION_OPTIONS;
  }

  /**
   * Get upcoming deliveries for a subscription (next 4 deliveries)
   */
  static getUpcomingDeliveries(
    startDate: Date, 
    frequency: 'weekly' | 'monthly', 
    count: number = 4
  ): Date[] {
    const deliveries: Date[] = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < count; i++) {
      const nextDelivery = this.getNextScheduledDelivery(currentDate, frequency, currentDate);
      deliveries.push(new Date(nextDelivery));
      currentDate = nextDelivery;
    }
    
    return deliveries;
  }
}
