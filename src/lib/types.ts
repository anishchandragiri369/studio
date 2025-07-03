import type { z } from 'zod';
import type { loginSchema, signUpSchema, forgotPasswordSchema, checkoutAddressSchema, editProfileSchema, addProductFormSchema } from '@/lib/zod-schemas';


export interface Juice {
  id: string;
  name: string;
  flavor: string;
  price: number;
  image: string;
  image_url?: string; // Potential alias from Supabase
  description?: string;
  category?: string; // e.g., 'Fruit Blast', 'Green Power', 'Detox'
  tags?: string[]; // e.g., 'sweet', 'organic', 'low-calorie'
  dataAiHint?: string; // For placeholder images
  data_ai_hint?: string; // Potential alias from Supabase
  availability?: 'In Stock' | 'Low Stock' | 'Out of Stock'; // Kept for potential fallback, but stockQuantity is primary
  stockQuantity?: number; // New field for numerical stock
  stock_quantity?: number; // Potential alias from Supabase
}

export interface FruitBowl {
  id: string;
  name: string;
  flavor: string;
  price: number;
  image: string;
  image_url?: string; // Potential alias from Supabase
  description?: string;
  category?: string; // e.g., 'Breakfast Bowls', 'Power Bowls', 'Tropical Bowls'
  tags?: string[]; // e.g., 'breakfast', 'protein', 'antioxidant'
  dataAiHint?: string; // For placeholder images
  data_ai_hint?: string; // Potential alias from Supabase
  availability?: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockQuantity?: number;
  stock_quantity?: number; // Potential alias from Supabase
  preparation_time?: number; // in minutes
  serving_size?: string; // e.g., "1 bowl", "250g"
  dietary_tags?: string[]; // e.g., 'vegan', 'gluten-free', 'organic'
  allergen_info?: string[]; // e.g., 'nuts', 'dairy', 'gluten'
  ingredients?: {
    fruits?: Array<{
      name: string;
      quantity: string;
      organic: boolean;
    }>;
    toppings?: Array<{
      name: string;
      quantity: string;
    }>;
    greens?: Array<{
      name: string;
      quantity: string;
      organic: boolean;
    }>;
  };
  nutritional_info?: {
    calories: number;
    protein: string;
    carbs: string;
    fiber: string;
    sugar: string;
    fat: string;
    vitamins: Record<string, string>;
  };
}

export interface CartItem extends Juice {
  quantity: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string; // e.g., 'Weekly Kickstarter', 'Monthly Wellness'
  frequency: 'weekly' | 'monthly';
  pricePerDelivery: number;
  description: string;
  defaultJuices?: { juiceId: string; quantity: number }[]; // Optional: pre-selected juices
  defaultFruitBowls?: { fruitBowlId: string; quantity: number }[]; // Optional: pre-selected fruit bowls
  isCustomizable?: boolean;
  maxJuices?: number; // Max number of juices for customizable plans
  maxFruitBowls?: number; // Max number of fruit bowls for customizable plans
  includesFruitBowls?: boolean; // Whether this plan supports fruit bowls
  planType?: 'juice-only' | 'fruit-bowl-only' | 'customized'; // Type of plan
}

// For AI Recipe Suggestion
export type RecipeSuggestion = {
  recipeName: string;
  ingredients: string; // Could be an array of objects { name: string, amount: string }
  instructions: string;
};

// For AI Subscription Plan Suggestion
export type AISubscriptionPlanSuggestionItem = {
  juiceFlavor: string;
  quantity: number;
};
export type AISubscriptionPlanSuggestion = {
  suggestedPlan: AISubscriptionPlanSuggestionItem[];
  reasoning: string;
};

// For AI Juice Combination Recommendation
export type AIJuiceCombination = {
  name: string; // e.g. "Tropical Morning Boost"
  juices: { juiceName: string; quantity: number }[]; // references juice names
  reasoning?: string;
};

export type AIJuiceRecommendationOutput = {
  recommendations: AIJuiceCombination[];
}

// Auth Form Data Types
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type CheckoutAddressFormData = z.infer<typeof checkoutAddressSchema>;
export type EditProfileFormData = z.infer<typeof editProfileSchema>;

// Order History Types
type InternalOrderId = string; // Or number, depending on your Supabase ID type

export interface OrderItem {
  juiceId: string;
  juiceName: string;
  image?: string; // Optional: if you want to show item images in order history
  quantity: number;
  pricePerItem: number; // Price at the time of order
}

export interface Order {
  id: InternalOrderId; // Use InternalOrderId here for the database ID
  cashfreeOrderId?: string; // Optional: To store the Cashfree order ID as well
  orderDate?: string; // ISO string or formatted date string - Will be set by Supabase
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Payment Pending' | 'Payment Success' | 'Payment Failed'; // Added payment statuses
  items: OrderItem[];
  shippingAddress?: CheckoutAddressFormData; // Optional: if you want to show where it was shipped
  // Add any other fields you store in your Supabase 'orders' table
  // e.g., userId: string;
}

// New Product Form Data Type (using addProductFormSchema)
export type AddProductFormData = z.infer<typeof addProductFormSchema>;

// Subscription Management Types
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'admin_paused';
  created_at: string;
  updated_at: string;
  next_delivery_date: string;
  pause_date?: string;
  pause_reason?: string;
  reactivation_deadline?: string; // 3 months from pause date
  delivery_frequency: 'weekly' | 'monthly';
  selected_juices?: { juiceId: string; quantity: number }[];
  delivery_address: CheckoutAddressFormData;
  total_amount: number;
  // New duration-based fields
  subscription_duration: 2 | 3 | 4 | 6 | 12; // months
  subscription_start_date: string;
  subscription_end_date: string;
  original_price: number;
  discount_percentage: number;
  discount_amount: number;
  final_price: number;
  renewal_notification_sent?: boolean;
  // Admin pause fields
  admin_pause_id?: string;
  admin_pause_start?: string;
  admin_pause_end?: string;
  admin_reactivated_at?: string;
  admin_reactivated_by?: string;
}

// Subscription duration options with discount tiers
export interface SubscriptionDurationOption {
  months: 1 | 2 | 3 | 4 | 6 | 12;
  discountPercentage: number;
  discountType: 'bronze' | 'silver' | 'gold' | 'platinum' | 'none';
  label: string;
  weeks?: number; // Optional field for weekly subscriptions to specify actual weeks
}

export interface SubscriptionDelivery {
  id: string;
  subscription_id: string;
  delivery_date: string;
  status: 'scheduled' | 'delivered' | 'skipped' | 'failed';
  items: { juiceId: string; quantity: number }[];
  created_at: string;
  updated_at: string;
}

// For AI Juice Combination Recommendation Input
export type RecommendJuiceCombinationsInput = {
  pastOrders: string;
  preferences?: string;
  // Add more fields as needed for your AI flow
};

export type SuggestSubscriptionPlanInput = {
  preferences: string;
  availableJuices: string[];
  tastePreferences?: string;
  consumptionHabits?: string;
  orderHistory?: string;
  availableJuiceFlavors?: string[];
  // Add more fields as needed for your AI flow/component
};

export interface FruitBowlSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  frequency: 'weekly' | 'monthly';
  duration_weeks: number;
  min_bowls_per_delivery: number;
  max_bowls_per_delivery: number;
  price_per_week: number;
  total_price: number;
  deliveries_per_week: number;
  customization_allowed: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserFruitBowlSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan?: FruitBowlSubscriptionPlan;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  next_delivery_date: string;
  delivery_address: CheckoutAddressFormData;
  selected_bowls: {
    [date: string]: {
      bowl_ids: string[];
      quantities: number[];
      time_slot: string;
    };
  };
  special_instructions?: string;
  pause_date?: string;
  pause_reason?: string;
  reactivation_deadline?: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at?: string;
  updated_at?: string;
}

export interface FruitBowlSubscriptionDelivery {
  id: string;
  subscription_id: string;
  delivery_date: string;
  time_slot: string;
  bowls: Array<{
    bowl_id: string;
    bowl?: FruitBowl;
    quantity: number;
  }>;
  quantity_per_bowl: Record<string, number>;
  status: 'scheduled' | 'preparing' | 'out_for_delivery' | 'delivered' | 'skipped' | 'failed';
  delivery_notes?: string;
  delivered_at?: string;
  delivery_person?: string;
  tracking_info?: any;
  customer_rating?: number;
  customer_feedback?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FruitBowlCustomization {
  id: string;
  user_id: string;
  bowl_id: string;
  bowl?: FruitBowl;
  customizations: {
    ingredient_modifications?: Array<{
      ingredient: string;
      action: 'add' | 'remove' | 'substitute';
      substitute_with?: string;
      extra_quantity?: string;
    }>;
    dietary_preferences?: string[];
    preparation_notes?: string;
  };
  notes?: string;
  is_favorite: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartFruitBowl extends FruitBowl {
  quantity: number;
  customizations?: FruitBowlCustomization['customizations'];
}

// Advanced Subscription Features Types

// Gift Subscription System
export interface GiftSubscription {
  id: string;
  gifter_user_id: string;
  recipient_email: string;
  recipient_name: string;
  recipient_phone?: string;
  subscription_plan_id: string;
  subscription_duration: 2 | 3 | 4 | 6 | 12;
  custom_message?: string;
  delivery_date?: string;
  status: 'pending' | 'sent' | 'claimed' | 'expired' | 'cancelled';
  gift_code: string;
  total_amount: number;
  recipient_user_id?: string;
  created_subscription_id?: string;
  is_anonymous: boolean;
  delivery_address?: CheckoutAddressFormData;
  notification_sent: boolean;
  claimed_at?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface GiftSubscriptionFormData {
  recipient_email: string;
  recipient_name: string;
  recipient_phone?: string;
  subscription_plan_id: string;
  subscription_duration: 2 | 3 | 4 | 6 | 12;
  custom_message?: string;
  delivery_date?: string;
  is_anonymous: boolean;
  delivery_address: CheckoutAddressFormData;
}

// Family Sharing System
export interface FamilyGroup {
  id: string;
  group_name: string;
  primary_user_id: string;
  invite_code: string;
  max_members: number;
  is_active: boolean;
  shared_delivery_address?: CheckoutAddressFormData;
  allow_individual_deliveries: boolean;
  default_delivery_schedule?: any;
  created_at: string;
  updated_at: string;
}

export interface FamilyGroupMember {
  id: string;
  family_group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  permissions: {
    can_pause: boolean;
    can_modify_address: boolean;
    can_view_billing: boolean;
  };
  delivery_address?: CheckoutAddressFormData;
  notification_preferences: {
    delivery_reminders: boolean;
    group_updates: boolean;
  };
}

export interface FamilySharedSubscription {
  id: string;
  family_group_id: string;
  subscription_id: string;
  billing_member_id: string;
  delivery_distribution: any; // JSON configuration for delivery splitting
  cost_sharing: any; // JSON configuration for cost splitting
  member_juice_selections?: any; // JSON with member preferences
  created_at: string;
  updated_at: string;
}

// Corporate Wellness Program
export interface CorporateAccount {
  id: string;
  company_name: string;
  company_email: string;
  contact_person: string;
  contact_phone?: string;
  account_manager_id?: string;
  billing_address: CheckoutAddressFormData;
  tax_id?: string;
  employee_limit: number;
  monthly_budget?: number;
  subsidy_percentage: number;
  allowed_plans?: string[]; // Plan IDs that are covered
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CorporateEmployee {
  id: string;
  corporate_account_id: string;
  user_id: string;
  employee_id?: string;
  department?: string;
  position?: string;
  enrollment_date: string;
  is_active: boolean;
  monthly_allowance?: number;
  used_allowance: number;
}

export interface CorporateSubscription {
  id: string;
  corporate_account_id: string;
  employee_id: string;
  subscription_id: string;
  corporate_contribution: number;
  employee_contribution: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

// Subscription Transfer Marketplace
export interface SubscriptionTransfer {
  id: string;
  subscription_id: string;
  seller_user_id: string;
  asking_price: number;
  remaining_deliveries: number;
  original_price: number;
  transfer_reason?: string;
  title: string;
  description?: string;
  is_negotiable: boolean;
  status: 'listed' | 'pending' | 'completed' | 'cancelled' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionTransferOffer {
  id: string;
  transfer_id: string;
  buyer_user_id: string;
  offered_price: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  seller_response?: string;
  responded_at?: string;
  created_at: string;
}

export interface SubscriptionTransferTransaction {
  id: string;
  transfer_id: string;
  offer_id?: string;
  seller_user_id: string;
  buyer_user_id: string;
  final_price: number;
  platform_fee: number;
  seller_amount: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_id?: string;
  escrow_released: boolean;
  subscription_transferred_at?: string;
  transfer_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Subscription Notifications
export interface SubscriptionNotification {
  id: string;
  user_id: string;
  type: string; // 'gift_received', 'family_invite', 'transfer_offer', etc.
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
  is_read: boolean;
  is_action_required: boolean;
  action_url?: string;
  email_sent: boolean;
  sms_sent: boolean;
  push_sent: boolean;
  created_at: string;
  read_at?: string;
}

// Form Data Types for Advanced Features
export interface CreateFamilyGroupFormData {
  group_name: string;
  max_members: number;
  shared_delivery_address?: CheckoutAddressFormData;
  allow_individual_deliveries: boolean;
}

export interface CreateTransferListingFormData {
  asking_price: number;
  title: string;
  description?: string;
  transfer_reason?: string;
  is_negotiable: boolean;
}

export interface MakeTransferOfferFormData {
  offered_price: number;
  message?: string;
}

export interface CorporateAccountFormData {
  company_name: string;
  company_email: string;
  contact_person: string;
  contact_phone?: string;
  billing_address: CheckoutAddressFormData;
  tax_id?: string;
  employee_limit: number;
  monthly_budget?: number;
  subsidy_percentage: number;
}

// Enhanced User Subscription with Advanced Features
export interface EnhancedUserSubscription extends UserSubscription {
  // Gift subscription info (if this subscription was gifted)
  gift_info?: {
    gifter_name?: string;
    custom_message?: string;
    is_anonymous: boolean;
  };
  
  // Family sharing info (if this subscription is shared)
  family_sharing?: {
    family_group_id: string;
    billing_member_id: string;
    member_role: 'admin' | 'member';
    cost_split_percentage: number;
  };
  
  // Corporate wellness info (if this subscription is corporate-funded)
  corporate_info?: {
    corporate_account_id: string;
    corporate_contribution: number;
    employee_contribution: number;
    monthly_allowance_used: number;
  };
  
  // Transfer info (if this subscription is transferable/was transferred)
  transfer_eligible: boolean;
  transfer_history?: SubscriptionTransferTransaction[];
}

// Enhanced Delivery Scheduling Types
export interface DeliveryTimeWindow {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  delivery_fee_modifier: number;
  max_capacity: number;
  days_of_week: number[];
  created_at: string;
  updated_at: string;
  stats?: {
    today_bookings: number;
    weekly_bookings: number;
    available_slots: number;
    utilization_rate: number;
    is_full: boolean;
  };
}

export interface CustomerDeliveryPreferences {
  id: string;
  user_id: string;
  subscription_id: string;
  preferred_time_window_id?: string;
  alternative_time_window_id?: string;
  special_instructions?: string;
  is_flexible: boolean;
  preferred_days: number[];
  avoid_days: number[];
  created_at: string;
  updated_at: string;
}

export interface EnhancedSubscriptionDelivery {
  id: string;
  subscription_id: string;
  delivery_date: string;
  delivery_time_window_id?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  actual_delivery_time?: string;
  delivery_instructions?: string;
  delivery_person_id?: string;
  delivery_rating?: number;
  delivery_feedback?: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface RevenueAnalytics {
  date: string;
  total_revenue: number;
  gift_revenue: number;
  family_revenue: number;
  corporate_revenue: number;
  transfer_fees: number;
}

export interface CustomerAcquisitionAnalytics {
  period: string;
  new_customers: number;
  gift_acquisitions: number;
  family_acquisitions: number;
  corporate_acquisitions: number;
  conversion_rate: number;
}

export interface ChurnAnalytics {
  period: string;
  churned_customers: number;
  churn_rate: number;
  retention_rate: number;
  churn_reasons: Array<{
    reason: string;
    count: number;
  }>;
}

export interface SubscriptionAnalyticsSummary {
  total_revenue: number;
  total_new_customers: number;
  average_churn_rate: number;
  growth_rate: number;
}

export interface SubscriptionAnalyticsData {
  revenue_trends: RevenueAnalytics[];
  customer_acquisition: CustomerAcquisitionAnalytics[];
  churn_analysis: ChurnAnalytics[];
  summary: SubscriptionAnalyticsSummary;
}

// Delivery Window Form Data
export interface DeliveryWindowFormData {
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  deliveryFeeModifier: number;
  maxCapacity: number;
  daysOfWeek: number[];
}

export interface DeliveryPreferencesFormData {
  subscriptionId: string;
  userId: string;
  preferredTimeWindowId?: string;
  alternativeTimeWindowId?: string;
  specialInstructions?: string;
  isFlexible: boolean;
  preferredDays: number[];
  avoidDays: number[];
}

