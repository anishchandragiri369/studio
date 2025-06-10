
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
export interface OrderItem {
  juiceId: string;
  juiceName: string;
  image?: string; // Optional: if you want to show item images in order history
  quantity: number;
  pricePerItem: number; // Price at the time of order
}

export interface Order {
  id: string;
  orderDate: string; // ISO string or formatted date string
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  shippingAddress?: CheckoutAddressFormData; // Optional: if you want to show where it was shipped
}

// New Product Form Data Type (using addProductFormSchema)
export type AddProductFormData = z.infer<typeof addProductFormSchema>;

    