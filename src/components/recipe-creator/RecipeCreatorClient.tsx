"use client";

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, PlusCircle, XCircle } from 'lucide-react';
import { suggestRecipeFromFlavors } from '@/ai/flows/suggest-recipe-from-flavors'; // AI Flow
import type { RecipeSuggestion } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RecipeCreatorClient = () => {
  const [flavors, setFlavors] = useState<string[]>(['', '']);
  const [suggestion, setSuggestion] = useState<RecipeSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFlavorChange = (index: number, value: string) => {
    const newFlavors = [...flavors];
    newFlavors[index] = value;
    setFlavors(newFlavors);
  };

  const addFlavorInput = () => {
    setFlavors([...flavors, '']);
  };

  const removeFlavorInput = (index: number) => {
    if (flavors.length > 2) { // Keep at least two flavor inputs
      const newFlavors = flavors.filter((_, i) => i !== index);
      setFlavors(newFlavors);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuggestion(null);

    const validFlavors = flavors.filter(f => f.trim() !== '');
    if (validFlavors.length < 2) {
      setError("Please enter at least two flavors.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await suggestRecipeFromFlavors({ flavors: validFlavors });
        setSuggestion(result);
      } catch (err) {
        console.error("AI recipe suggestion error:", err);
        setError("Failed to generate a recipe. Please try different flavors or try again later.");
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Sparkles className="text-primary" /> AI Recipe Creator
        </CardTitle>
        <CardDescription>Enter some juice flavors and let our AI craft a unique recipe for you!</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="font-medium">Juice Flavors</Label>
            {flavors.map((flavor, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="text"
                  value={flavor}
                  onChange={(e) => handleFlavorChange(index, e.target.value)}
                  placeholder={`Flavor ${index + 1} (e.g., Orange, Kale, Ginger)`}
                  required={index < 2} 
                />
                {flavors.length > 2 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFlavorInput(index)} aria-label="Remove flavor">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addFlavorInput} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Another Flavor
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full text-lg py-3">
            {isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            Create My Recipe
          </Button>
        </CardFooter>
      </form>

      {error && (
        <Alert variant="destructive" className="m-6 mt-0">
          <AlertTitle>Oops!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestion && (
        <Card className="m-6 mt-0 border-2 border-primary shadow-lg bg-background/50">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">{suggestion.recipeName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">Ingredients:</h4>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{suggestion.ingredients}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Instructions:</h4>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{suggestion.instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </Card>
  );
};

export default RecipeCreatorClient;
