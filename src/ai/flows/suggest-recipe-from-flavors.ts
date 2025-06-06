'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting juice recipes based on user-specified flavors.
 *
 * - suggestRecipeFromFlavors - A function that suggests a juice recipe based on a combination of flavors.
 * - SuggestRecipeFromFlavorsInput - The input type for the suggestRecipeFromFlavors function.
 * - SuggestRecipeFromFlavorsOutput - The return type for the suggestRecipeFromFlavors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRecipeFromFlavorsInputSchema = z.object({
  flavors: z.array(z.string()).describe('A list of juice flavors to combine in a recipe.'),
});
export type SuggestRecipeFromFlavorsInput = z.infer<typeof SuggestRecipeFromFlavorsInputSchema>;

const SuggestRecipeFromFlavorsOutputSchema = z.object({
  recipeName: z.string().describe('The name of the suggested juice recipe.'),
  ingredients: z.string().describe('A list of ingredients and their ratios for the recipe.'),
  instructions: z.string().describe('Instructions on how to prepare the juice recipe.'),
});
export type SuggestRecipeFromFlavorsOutput = z.infer<typeof SuggestRecipeFromFlavorsOutputSchema>;

export async function suggestRecipeFromFlavors(input: SuggestRecipeFromFlavorsInput): Promise<SuggestRecipeFromFlavorsOutput> {
  return suggestRecipeFromFlavorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRecipeFromFlavorsPrompt',
  input: {schema: SuggestRecipeFromFlavorsInputSchema},
  output: {schema: SuggestRecipeFromFlavorsOutputSchema},
  prompt: `You are an expert mixologist specializing in creating unique and delicious juice recipes. Given a list of juice flavors, create a novel juice recipe with a descriptive name, a list of ingredients and their ratios, and instructions on how to prepare the juice.

Flavors: {{flavors}}`,
});

const suggestRecipeFromFlavorsFlow = ai.defineFlow(
  {
    name: 'suggestRecipeFromFlavorsFlow',
    inputSchema: SuggestRecipeFromFlavorsInputSchema,
    outputSchema: SuggestRecipeFromFlavorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
