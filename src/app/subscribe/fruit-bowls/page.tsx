"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function FruitBowlSubscriptionRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      router.push('/subscriptions');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 px-4">
      <Card className="max-w-2xl w-full text-center shadow-xl">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary mb-2">
            Fruit Bowls Are Now Unified!
          </CardTitle>
          <p className="text-muted-foreground text-lg">
            We've improved your experience by combining juice and fruit bowl subscriptions in one place.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-green-800 mb-2">🎉 What's New:</h3>
              <ul className="text-green-700 space-y-1 text-sm">
                <li>• Fruit bowl plans now appear alongside juice plans</li>
                <li>• Same easy selection process for both juices and fruit bowls</li>
                <li>• Weekly and monthly fruit bowl subscriptions available</li>
                <li>• Unified cart and checkout experience</li>
              </ul>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-6">
            You'll be automatically redirected in a few seconds, or click below to go now.
          </p>
          
          <div className="flex gap-3 justify-center">
            <Link href="/subscriptions">
              <Button className="bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white">
                View All Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/subscriptions/subscribe?plan=fruit-bowl-weekly">
              <Button variant="outline">
                Go to Fruit Bowl Plans
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
