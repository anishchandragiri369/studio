// Subscription management utilities
import type { SubscriptionDurationOption } from './types';
import { SUBSCRIPTION_DURATION_OPTIONS, RENEWAL_NOTIFICATION_DAYS } from './constants';

export class SubscriptionManager {
  
  /**
   * Check if a subscription can be paused (24 hours notice required)
   */
  static canPauseSubscription(nextDeliveryDate: string): { canPause: boolean; reason?: string } {
    const now = new Date();
    const deliveryDate = new Date(nextDeliveryDate);
    const hoursUntilDelivery = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDelivery < 24) {
      return {
        canPause: false,
        reason: `Cannot pause subscription. Next delivery is in ${Math.round(hoursUntilDelivery)} hours. Minimum 24 hours notice required.`
      };
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
    const nextDate = new Date(currentDate);
    
    if (frequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
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
  }

  /**
   * Calculate subscription pricing with discount
   */
  static calculateSubscriptionPricing(basePrice: number, durationMonths: 2 | 3 | 4 | 6 | 12): {
    originalPrice: number;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
    discountType: string;
  } {
    const durationOption = SUBSCRIPTION_DURATION_OPTIONS.find(option => option.months === durationMonths);
    
    if (!durationOption) {
      return {
        originalPrice: basePrice * durationMonths,
        discountPercentage: 0,
        discountAmount: 0,
        finalPrice: basePrice * durationMonths,
        discountType: 'bronze'
      };
    }

    const originalPrice = basePrice * durationMonths;
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
  static getDurationOptions(): SubscriptionDurationOption[] {
    return SUBSCRIPTION_DURATION_OPTIONS;
  }
}
