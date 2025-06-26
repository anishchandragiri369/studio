'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

export default function TestWebhookPage() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testWebhook = async () => {
    if (!orderId.trim()) {
      setResult({ success: false, error: 'Please enter an order ID' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Simulate webhook payload
      const webhookPayload = {
        type: 'PAYMENT_SUCCESS_WEBHOOK',
        event_time: new Date().toISOString(),
        data: {
          order: {
            order_id: `elixr_${orderId.trim()}`, // Add elixr_ prefix
            order_amount: 299.00,
            order_currency: 'INR',
            order_status: 'PAID'
          },
          payment: {
            payment_status: 'SUCCESS',
            payment_amount: 299.00,
            payment_currency: 'INR',
            payment_message: 'Transaction successful',
            payment_time: new Date().toISOString()
          }
        }
      };      // Call webhook directly (for testing)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/webhook/payment-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-timestamp': Math.floor(Date.now() / 1000).toString(),
          'x-webhook-signature': 'test-signature' // For testing - will be skipped in dev
        },
        body: JSON.stringify(webhookPayload),
      });

      const data = await response.json();
      setResult({ success: response.ok, data, status: response.status });
    } catch (error) {
      setResult({ success: false, error: 'Failed to test webhook' });
    } finally {
      setLoading(false);
    }
  };

  const checkOrder = async () => {
    if (!orderId.trim()) {
      setResult({ success: false, error: 'Please enter an order ID' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Call the email API to check if order exists
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/send-order-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId.trim(),
        }),
      });

      const data = await response.json();
      setResult({ 
        success: response.ok, 
        data, 
        status: response.status,
        type: 'order-check'
      });
    } catch (error) {
      setResult({ success: false, error: 'Failed to check order' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Webhook & Email Testing</CardTitle>
          <CardDescription>
            Debug webhook processing and email sending functionality. Enter an existing order ID to test.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="orderId" className="text-sm font-medium">
              Order ID (without elixr_ prefix)
            </label>
            <Input
              id="orderId"
              type="text"
              placeholder="Enter order ID (e.g., 12345-67890-abcdef)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={checkOrder} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Checking...' : 'Check Order & Send Emails'}
            </Button>
            
            <Button 
              onClick={testWebhook} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Simulate Webhook'}
            </Button>
          </div>

          {result && (
            <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <AlertDescription>
                <div className="space-y-3">
                  <div className="font-semibold">
                    {result.success ? '✅ Test Result' : '❌ Test Failed'}
                    {result.status && ` (${result.status})`}
                  </div>
                  
                  {result.type === 'order-check' && result.success && (
                    <div className="space-y-1 text-sm">
                      <div>Customer Email: {result.data.userEmailSent ? '✅ Sent' : '❌ Failed'}</div>
                      <div>Admin Email: {result.data.adminEmailSent ? '✅ Sent' : '❌ Failed'}</div>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-red-600 text-sm">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">Raw Response</summary>
                      <Textarea
                        value={JSON.stringify(result.data, null, 2)}
                        readOnly
                        className="mt-2 h-40 font-mono text-xs"
                      />
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-3">
            <div className="font-medium">Debugging Steps:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a test order through normal checkout flow</li>
              <li>Complete payment to generate order in database</li>
              <li>Copy the order ID (without elixr_ prefix)</li>
              <li>Use "Check Order & Send Emails" to test email system</li>
              <li>Use "Simulate Webhook" to test webhook processing</li>
              <li>Check Netlify Functions logs for detailed error information</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg text-sm space-y-2">
            <div className="font-medium">Common Issues & Solutions:</div>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Order not found:</strong> Ensure order exists in Supabase with correct ID</li>
              <li><strong>Email sending fails:</strong> Check Gmail OAuth2 configuration in environment variables</li>
              <li><strong>Database update fails:</strong> Verify status column accepts 'Payment Success'/'Payment Failed'</li>
              <li><strong>Webhook signature fails:</strong> Check CASHFREE_SECRET_KEY environment variable</li>
              <li><strong>No user email:</strong> Ensure order has email in email, customer_email, or shipping_address.email</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-sm">
            <div className="font-medium">Environment Variables Required:</div>
            <div className="mt-2 font-mono text-xs space-y-1">
              <div>NEXT_PUBLIC_SUPABASE_URL</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
              <div>CASHFREE_SECRET_KEY</div>
              <div>GMAIL_USER</div>
              <div>GMAIL_CLIENT_ID</div>
              <div>GMAIL_CLIENT_SECRET</div>
              <div>GMAIL_REFRESH_TOKEN</div>
              <div>ADMIN_EMAIL</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
