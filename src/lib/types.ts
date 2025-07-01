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
  isCustomizable?: boolean;
  maxJuices?: number; // Max number of items for customizable plans
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

// Fruit Bowl Types
export interface FruitBowl {
  id: string;
  name: string;
  description: string;
  ingredients: {
    fruits: Array<{
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
  nutritional_info: {
    calories: number;
    protein: string;
    carbs: string;
    fiber: string;
    sugar: string;
    fat: string;
    vitamins: Record<string, string>;
  };
  price: number;
  image_url?: string;
  category: string;
  serving_size: string;
  preparation_time: number;
  allergen_info: string[];
  dietary_tags: string[];
  seasonal_availability: boolean;
  stock_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

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

