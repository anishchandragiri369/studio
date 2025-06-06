'use server';

/**
 * @fileOverview A flow to suggest a juice subscription plan tailored to user preferences.
 *
 * - suggestSubscriptionPlan - A function that suggests a juice subscription plan.
 * - SuggestSubscriptionPlanInput - The input type for the suggestSubscriptionPlan function.
 * - SuggestSubscriptionPlanOutput - The return type for the suggestSubscriptionPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSubscriptionPlanInputSchema = z.object({
  tastePreferences: z
    .string()
    .describe('The user taste preferences (e.g., sweet, sour, fruity, veggie).'),
  consumptionHabits: z
    .string()
    .describe(
      'The user consumption habits (e.g., daily, weekly, occasional drinker; number of juices per week).'
    ),
  availableJuiceFlavors: z
    .array(z.string())
    .describe('A list of available juice flavors.'),
  orderHistory: z
    .string()
    .optional()
    .describe('The user order history of juices, if available.'),
});
export type SuggestSubscriptionPlanInput = z.infer<typeof SuggestSubscriptionPlanInputSchema>;

const SuggestedPlanItemSchema = z.object({
  juiceFlavor: z.string().describe('The name or flavor of the juice.'),
  quantity: z.number().describe('The quantity of this juice in the subscription.'),
});

const SuggestSubscriptionPlanOutputSchema = z.object({
  suggestedPlan: z
    .array(SuggestedPlanItemSchema)
    .describe('A list of juice flavors and quantities for the suggested subscription plan.'),
  reasoning: z
    .string()
    .describe('The AI reasoning for suggesting this subscription plan.'),
});
export type SuggestSubscriptionPlanOutput = z.infer<typeof SuggestSubscriptionPlanOutputSchema>;

export async function suggestSubscriptionPlan(
  input: SuggestSubscriptionPlanInput
): Promise<SuggestSubscriptionPlanOutput> {
  return suggestSubscriptionPlanFlow(input);
}

const suggestSubscriptionPlanPrompt = ai.definePrompt({
  name: 'suggestSubscriptionPlanPrompt',
  input: {schema: SuggestSubscriptionPlanInputSchema},
  output: {schema: SuggestSubscriptionPlanOutputSchema},
  prompt: `You are an AI assistant specialized in suggesting personalized juice subscription plans.

  Based on the user's taste preferences, consumption habits, available juice flavors, and order history (if available), suggest a juice subscription plan that includes a list of juice flavors and quantities.

  Taste Preferences: {{{tastePreferences}}}
  Consumption Habits: {{{consumptionHabits}}}
  Available Juice Flavors: {{#each availableJuiceFlavors}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  Order History: {{{orderHistory}}}

  Consider the user's preferences and habits to create a plan that suits their needs.
  Explain the AI reasoning for the suggested plan.
  Make sure the suggested plan consists of available juice flavors.
  Make sure the suggested plan is realistic given the consumption habits.
  `,
});

const suggestSubscriptionPlanFlow = ai.defineFlow(
  {name: 'suggestSubscriptionPlanFlow', inputSchema: SuggestSubscriptionPlanInputSchema, outputSchema: SuggestSubscriptionPlanOutputSchema},
  async input => {
    const {output} = await suggestSubscriptionPlanPrompt(input);
    return output!;
  }
);
