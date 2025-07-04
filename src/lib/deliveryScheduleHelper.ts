import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DeliveryScheduleSetting {
  subscription_type: string;
  delivery_gap_days: number;
  is_daily: boolean;
  description: string;
  is_active: boolean;
  updated_at: string;
  updated_by_email: string;
}

export interface SubscriptionTypeMapping {
  [key: string]: string;
}

// Map subscription plan IDs to subscription types
const SUBSCRIPTION_TYPE_MAPPING: SubscriptionTypeMapping = {
  'juice_weekly': 'juices',
  'juice_monthly': 'juices',
  'fruit_bowl_daily': 'fruit_bowls',
  'fruit_bowl_weekly': 'fruit_bowls',
  'customized_weekly': 'customized',
  'customized_monthly': 'customized',
  // Add more mappings as needed
};

/**
 * Get the subscription type from plan ID
 */
export function getSubscriptionTypeFromPlanId(planId: string): string {
  // Direct mapping first
  if (SUBSCRIPTION_TYPE_MAPPING[planId]) {
    return SUBSCRIPTION_TYPE_MAPPING[planId];
  }

  // Fallback logic based on plan ID naming convention
  if (planId.toLowerCase().includes('juice')) {
    return 'juices';
  } else if (planId.toLowerCase().includes('fruit') || planId.toLowerCase().includes('bowl')) {
    return 'fruit_bowls';
  } else if (planId.toLowerCase().includes('custom')) {
    return 'customized';
  }

  // Default to customized if no match
  return 'customized';
}

/**
 * Get delivery schedule settings for all subscription types
 */
export async function getDeliveryScheduleSettings(): Promise<DeliveryScheduleSetting[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_delivery_schedule_settings');

    if (error) {
      console.error('Error fetching delivery schedule settings:', error);
      throw new Error('Failed to fetch delivery schedule settings');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDeliveryScheduleSettings:', error);
    throw error;
  }
}

/**
 * Get delivery schedule setting for a specific subscription type
 */
export async function getDeliveryScheduleSettingByType(subscriptionType: string): Promise<DeliveryScheduleSetting | null> {
  try {
    const settings = await getDeliveryScheduleSettings();
    return settings.find(setting => setting.subscription_type === subscriptionType) || null;
  } catch (error) {
    console.error('Error in getDeliveryScheduleSettingByType:', error);
    return null;
  }
}

/**
 * Calculate next delivery date based on subscription type and current date
 */
export async function calculateNextDeliveryDate(
  subscriptionType: string, 
  currentDate: Date = new Date()
): Promise<Date> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_next_delivery_date', {
        p_subscription_type: subscriptionType,
        p_current_date: currentDate.toISOString()
      });

    if (error) {
      console.error('Error calculating next delivery date:', error);
      // Fallback to default calculation
      return getDefaultNextDeliveryDate(subscriptionType, currentDate);
    }

    return new Date(data);
  } catch (error) {
    console.error('Error in calculateNextDeliveryDate:', error);
    // Fallback to default calculation
    return getDefaultNextDeliveryDate(subscriptionType, currentDate);
  }
}

/**
 * Fallback function for calculating next delivery date
 */
function getDefaultNextDeliveryDate(subscriptionType: string, currentDate: Date): Date {
  const nextDate = new Date(currentDate);
  
  switch (subscriptionType) {
    case 'juices':
      // Default: 7 days for juices
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'fruit_bowls':
      // Default: 1 day for fruit bowls
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'customized':
      // Default: 3 days for customized
      nextDate.setDate(nextDate.getDate() + 3);
      break;
    default:
      // Default: 1 day
      nextDate.setDate(nextDate.getDate() + 1);
      break;
  }
  
  return nextDate;
}

/**
 * Update delivery schedule setting
 */
export async function updateDeliveryScheduleSetting(
  subscriptionType: string,
  deliveryGapDays: number,
  isDaily: boolean,
  description?: string,
  changeReason?: string,
  adminUserId?: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .rpc('update_delivery_schedule_setting', {
        p_subscription_type: subscriptionType,
        p_delivery_gap_days: deliveryGapDays,
        p_is_daily: isDaily,
        p_description: description || null,
        p_change_reason: changeReason || null,
        p_admin_user_id: adminUserId || null
      });

    if (error) {
      console.error('Error updating delivery schedule setting:', error);
      throw new Error('Failed to update delivery schedule setting');
    }

    return data;
  } catch (error) {
    console.error('Error in updateDeliveryScheduleSetting:', error);
    throw error;
  }
}

/**
 * Get delivery schedule audit history
 */
export async function getDeliveryScheduleAuditHistory(
  subscriptionType?: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_delivery_schedule_audit_history', {
        p_subscription_type: subscriptionType || null,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching delivery schedule audit history:', error);
      throw new Error('Failed to fetch audit history');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDeliveryScheduleAuditHistory:', error);
    throw error;
  }
}

/**
 * Update subscription deliveries based on new schedule settings
 * This function should be called when schedule settings are changed
 */
export async function updateSubscriptionDeliveriesSchedule(
  subscriptionType: string,
  newDeliveryGapDays: number,
  isDaily: boolean
): Promise<void> {
  try {
    // Get all active subscriptions of this type
    const { data: subscriptions, error: subsError } = await supabase
      .from('user_subscriptions')
      .select('id, next_delivery_date, plan_id')
      .eq('status', 'active');

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      return;
    }

    // Filter subscriptions by type
    const relevantSubscriptions = subscriptions?.filter(sub => 
      getSubscriptionTypeFromPlanId(sub.plan_id) === subscriptionType
    ) || [];

    // Update next delivery dates for relevant subscriptions
    const updatePromises = relevantSubscriptions.map(async (subscription) => {
      const currentNextDelivery = new Date(subscription.next_delivery_date);
      const newNextDelivery = await calculateNextDeliveryDate(subscriptionType, currentNextDelivery);

      return supabase
        .from('user_subscriptions')
        .update({ 
          next_delivery_date: newNextDelivery.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
    });

    await Promise.all(updatePromises);
    
    console.log(`Updated ${relevantSubscriptions.length} subscriptions for type: ${subscriptionType}`);
  } catch (error) {
    console.error('Error updating subscription deliveries schedule:', error);
  }
}

/**
 * Validate subscription type
 */
export function isValidSubscriptionType(type: string): boolean {
  const validTypes = ['juices', 'fruit_bowls', 'customized'];
  return validTypes.includes(type);
}

/**
 * Get human-readable subscription type label
 */
export function getSubscriptionTypeLabel(type: string): string {
  switch (type) {
    case 'juices':
      return 'Juice Subscriptions';
    case 'fruit_bowls':
      return 'Fruit Bowl Subscriptions';
    case 'customized':
      return 'Customized Subscriptions';
    default:
      return type;
  }
}

/**
 * Format delivery schedule description
 */
export function formatDeliverySchedule(deliveryGapDays: number, isDaily: boolean): string {
  if (isDaily) {
    return "Daily delivery (every day)";
  } else {
    return `Every ${deliveryGapDays} day${deliveryGapDays > 1 ? 's' : ''}`;
  }
}
