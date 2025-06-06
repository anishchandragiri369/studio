// This is an AI-powered code! Please review and test carefully.

'use server';

/**
 * @fileOverview Recommends personalized juice combinations based on user preferences and order history.
 *
 * - recommendJuiceCombinations - A function that returns a list of recommended juice combinations.
 * - RecommendJuiceCombinationsInput - The input type for the recommendJuiceCombinations function.
 * - RecommendJuiceCombinationsOutput - The return type for the recommendJuiceCombinations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendJuiceCombinationsInputSchema = z.object({
  pastOrders: z
    .string()
    .describe(
      'A stringified JSON array of the user historical juice orders, including juice names and quantities.'
    ),
  preferences: z
    .string()
    .optional()
    .describe(
      'A stringified JSON object of the user preferences, including favorite flavors, dietary restrictions, and health goals.'
    ),
});

export type RecommendJuiceCombinationsInput = z.infer<
  typeof RecommendJuiceCombinationsInputSchema
>;

const RecommendJuiceCombinationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe(
      'A stringified JSON array of juice combination recommendations, including juice names and quantities.  Each element of the array represents one recommended juice combination.'
    ),
});

export type RecommendJuiceCombinationsOutput = z.infer<
  typeof RecommendJuiceCombinationsOutputSchema
>;

export async function recommendJuiceCombinations(
  input: RecommendJuiceCombinationsInput
): Promise<RecommendJuiceCombinationsOutput> {
  return recommendJuiceCombinationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendJuiceCombinationsPrompt',
  input: {schema: RecommendJuiceCombinationsInputSchema},
  output: {schema: RecommendJuiceCombinationsOutputSchema},
  prompt: `You are a personal juice recommender. Analyze the customer's past orders and preferences to provide personalized juice combination suggestions. Return a JSON array of juice combinations.

Past Orders: {{{pastOrders}}}
Preferences: {{{preferences}}}

Based on this data, what juice combinations would you recommend? Please format your response as a JSON array.
`,
});

const recommendJuiceCombinationsFlow = ai.defineFlow(
  {
    name: 'recommendJuiceCombinationsFlow',
    inputSchema: RecommendJuiceCombinationsInputSchema,
    outputSchema: RecommendJuiceCombinationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
