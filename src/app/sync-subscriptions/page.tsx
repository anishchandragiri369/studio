"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SyncSubscriptionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const syncMissingSubscriptions = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sync subscriptions.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/subscriptions/sync-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();
      setSyncResult(result);

      if (result.success) {
        toast({
          title: "Sync Completed",
          description: `Successfully synced ${result.data.syncedCount} subscriptions.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.message || "Failed to sync subscriptions.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error syncing subscriptions:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while syncing.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Sync Missing Subscriptions</CardTitle>
          <CardDescription>
            This tool will sync any missing subscriptions from your <strong>successfully paid orders</strong> to the user_subscriptions table.
            Only orders with payment status "completed", "confirmed", "active", "processing", or "Payment Success" will be processed.
            Use this if you notice that orders are created but subscriptions don't appear in your account after successful payment.
          </CardDescription>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> This tool should only be used when:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
              <li>The payment was successful but subscription creation failed due to API issues</li>
              <li>You need to manually sync subscriptions after fixing system issues</li>
              <li>Orders have "Payment Success" status but no corresponding user_subscriptions</li>
            </ul>
            <p className="text-sm text-yellow-800 mt-2">
              <strong>Never use this for orders with pending or failed payments!</strong>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <p className="text-muted-foreground">Please log in to sync subscriptions.</p>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold">Current User:</h3>
                <p className="text-sm text-muted-foreground">
                  {user.email} (ID: {user.id})
                </p>
              </div>

              <Button 
                onClick={syncMissingSubscriptions}
                disabled={isSyncing}
                className="w-full"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Sync Missing Subscriptions'
                )}
              </Button>

              {syncResult && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Sync Result:</h4>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(syncResult, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 