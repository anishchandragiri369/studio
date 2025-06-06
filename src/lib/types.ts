export interface Juice {
  id: string;
  name: string;
  flavor: string;
  price: number;
  image: string;
  description?: string;
  category?: string; // e.g., 'Fruit Blast', 'Green Power', 'Detox'
  tags?: string[]; // e.g., 'sweet', 'organic', 'low-calorie'
  dataAiHint?: string; // For placeholder images
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
