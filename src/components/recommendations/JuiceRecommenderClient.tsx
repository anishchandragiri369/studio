"use client";

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { recommendJuiceCombinations } from '@/ai/flows/recommend-juice-combinations'; // AI Flow
import type { RecommendJuiceCombinationsInput, AIJuiceRecommendationOutput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MOCK_USER_ORDER_HISTORY, MOCK_AI_PREFERENCES_INPUT } from '@/lib/constants';
import { useCart } from '@/hooks/useCart';
import { JUICES } from '@/lib/constants';

const JuiceRecommenderClient = () => {
  const [recommendations, setRecommendations] = useState<AIJuiceRecommendationOutput['recommendations'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { addToCart } = useCart();

  // In a real app, pastOrders and preferences would come from user data / state
  const pastOrders = MOCK_USER_ORDER_HISTORY;
  const preferences = MOCK_AI_PREFERENCES_INPUT;


  const handleGetRecommendations = async () => {
    setError(null);
    setRecommendations(null);

    startTransition(async () => {
      try {
        const input: RecommendJuiceCombinationsInput = {
          pastOrders,
          preferences,
        };
        const result = await recommendJuiceCombinations(input);
        // The AI flow returns a stringified JSON, so parse it
        const parsedRecommendations = JSON.parse(result.recommendations) as AIJuiceRecommendationOutput['recommendations'];
        setRecommendations(parsedRecommendations);

      } catch (err) {
        console.error("AI recommendation error:", err);
        setError("Failed to get recommendations. Please try again.");
      }
    });
  };

  const handleAddCombinationToCart = (combo: AIJuiceRecommendationOutput['recommendations'][0]) => {
    combo.juices.forEach(recommendedJuice => {
      const juiceDetails = JUICES.find(j => j.name === recommendedJuice.juiceName);
      if (juiceDetails) {
        addToCart(juiceDetails, recommendedJuice.quantity);
      } else {
        console.warn(`Juice "${recommendedJuice.juiceName}" not found in current JUICES list.`);
        // Optionally, show a toast message to the user
      }
    });
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
          <Wand2 className="text-primary" /> Personalized Juice Picks
        </CardTitle>
        <CardDescription>Let AI suggest some tasty juice combinations based on your profile!</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-4">
            {recommendations.map((combo, index) => (
              <Card key={index} className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg font-headline">{combo.name || `Recommendation ${index + 1}`}</CardTitle>
                  {combo.reasoning && <CardDescription>{combo.reasoning}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside pl-2 space-y-1 text-sm">
                    {combo.juices.map((juice, jIndex) => (
                      <li key={jIndex}>{juice.quantity}x {juice.juiceName}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                   <Button onClick={() => handleAddCombinationToCart(combo)} size="sm" variant="outline">Add Combo to Cart</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
         {recommendations && recommendations.length === 0 && !isPending && (
           <p className="text-muted-foreground text-center py-4">No specific recommendations found at this time. Try exploring our menu!</p>
         )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetRecommendations} disabled={isPending} className="w-full">
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {recommendations ? 'Refresh Recommendations' : 'Get My Juice Recommendations'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JuiceRecommenderClient;
