// This file contains AI flow functions for static export compatibility.
// Server Actions ('use server') are not supported in static export.

/**
 * @fileOverview A flow to suggest a juice subscription plan tailored to user preferences.
 *
 * - suggestSubscriptionPlan - A function that suggests a juice subscription plan.
 * - SuggestSubscriptionPlanInput - The input type for the suggestSubscriptionPlan function.
 * - SuggestSubscriptionPlanOutput - The return type for the suggestSubscriptionPlan function.
 */

export interface SuggestSubscriptionPlanInput {
  tastePreferences: string;
  consumptionHabits: string;
  availableJuiceFlavors: string[];
  orderHistory?: string;
}

export interface SuggestedPlanItem {
  juiceFlavor: string;
  quantity: number;
}

export interface SuggestSubscriptionPlanOutput {
  suggestedPlan: SuggestedPlanItem[];
  reasoning: string;
}

// Placeholder function for static export compatibility
export async function suggestSubscriptionPlan(
  input: SuggestSubscriptionPlanInput
): Promise<SuggestSubscriptionPlanOutput> {
  // This would normally use AI to generate subscription plans
  // For static export, return mock data or empty results
  return {
    suggestedPlan: [
      { juiceFlavor: "Orange", quantity: 3 },
      { juiceFlavor: "Apple", quantity: 2 },
      { juiceFlavor: "Carrot", quantity: 2 }
    ],
    reasoning: "Based on your taste preferences and consumption habits, we recommend a balanced mix of citrus and vegetable juices for optimal nutrition."
  };
}
