"use client";

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { suggestSubscriptionPlan } from '@/ai/flows/suggest-subscription-plan'; // AI Flow
import type { AISubscriptionPlanSuggestion, SuggestSubscriptionPlanInput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AVAILABLE_JUICE_NAMES_FOR_AI } from '@/lib/constants'; // For default selection

const AISubscriptionRecommender = ({
  tastePreferences: initialTastePreferences,
  consumptionHabits: initialConsumptionHabits,
  availableJuiceFlavors,
  orderHistory: initialOrderHistory,
}: Partial<SuggestSubscriptionPlanInput>) => {
  const [tastePreferences, setTastePreferences] = useState(initialTastePreferences || '');
  const [consumptionHabits, setConsumptionHabits] = useState(initialConsumptionHabits || '');
  const [orderHistory, setOrderHistory] = useState(initialOrderHistory || '');
  
  const [suggestion, setSuggestion] = useState<AISubscriptionPlanSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuggestion(null);

    startTransition(async () => {
      try {
        const input = {
          availableJuiceFlavors: availableJuiceFlavors || AVAILABLE_JUICE_NAMES_FOR_AI,
          tastePreferences: tastePreferences || '',
          consumptionHabits: consumptionHabits || '',
          orderHistory: orderHistory || '',
        };
        const result = await suggestSubscriptionPlan(input);
        setSuggestion(result);
      } catch (err) {
        console.error("AI suggestion error:", err);
        setError("Failed to get a suggestion. Please try again.");
      }
    });
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center gap-2">
          <Sparkles className="text-primary" /> AI Plan Recommender
        </CardTitle>
        <CardDescription>Tell us a bit about yourself, and we&apos;ll suggest a plan.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tastePreferences">Your Taste Preferences</Label>
            <Textarea
              id="tastePreferences"
              value={tastePreferences}
              onChange={(e) => setTastePreferences(e.target.value)}
              placeholder="e.g., sweet, sour, fruity, veggie, specific fruits you like or dislike"
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="consumptionHabits">Your Consumption Habits</Label>
            <Textarea
              id="consumptionHabits"
              value={consumptionHabits}
              onChange={(e) => setConsumptionHabits(e.target.value)}
              placeholder="e.g., daily, 3 times a week, number of juices per serving"
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orderHistory">Order History (Optional)</Label>
            <Textarea
              id="orderHistory"
              value={orderHistory}
              onChange={(e) => setOrderHistory(e.target.value)}
              placeholder="e.g., 'Last month I ordered 2 Green Vitality and 3 Sunrise Orange.'"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Providing past orders helps us make better recommendations!</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Get My AI Suggestion
          </Button>
        </CardFooter>
      </form>

      {error && (
        <Alert variant="destructive" className="m-6 mt-0">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestion && (
        <Card className="m-6 mt-0 border-primary shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-lg text-primary">Your Personalized Suggestion!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold mb-1">Suggested Plan:</h4>
              <ul className="list-disc list-inside pl-2 space-y-1 text-sm">
                {suggestion.suggestedPlan.map((item, index) => (
                  <li key={index}>
                    {item.quantity}x {item.juiceFlavor}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Reasoning:</h4>
              <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </Card>
  );
};

export default AISubscriptionRecommender;
