'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { DevProtectionWrapper } from '@/lib/dev-protection';

export default function TestWebhookPage() {
  return (
    <DevProtectionWrapper>
      <TestWebhookContent />
    </DevProtectionWrapper>
  );
}

function TestWebhookContent() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<'success' | 'failure'>('success');

  const testWebhook = async () => {
    if (!orderId.trim()) {
      setResult({ success: false, error: 'Please enter an order ID' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Create appropriate webhook payload based on test type
      const webhookPayload = {
        type: testType === 'success' ? 'PAYMENT_SUCCESS_WEBHOOK' : 'PAYMENT_FAILED_WEBHOOK',
        event_time: new Date().toISOString(),
        data: {
          order: {
            order_id: `elixr_${orderId.trim()}`, // Add elixr_ prefix
            order_amount: 299.00,
            order_currency: 'INR',
            order_status: testType === 'success' ? 'PAID' : 'FAILED'
          },
          payment: {
            payment_status: testType === 'success' ? 'SUCCESS' : 'FAILED',
            payment_amount: 299.00,
            payment_currency: 'INR',
            payment_message: testType === 'success' 
              ? 'Transaction successful' 
              : 'Transaction failed due to insufficient funds',
            payment_time: new Date().toISOString()
          }
        }
      };

      // Call webhook directly (for testing)
      const response = await fetch('/api/webhook/payment-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-timestamp': Math.floor(Date.now() / 1000).toString(),
          'x-webhook-signature': 'test-signature' // For testing - will be skipped in dev
        },
        body: JSON.stringify(webhookPayload),
      });

      const data = await response.json();
      setResult({ 
        success: response.ok, 
        data, 
        status: response.status,
        testType,
        webhookPayload
      });
    } catch (error) {
      setResult({ 
        success: false, 
        error: 'Failed to test webhook',
        testType 
      });
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
      // Check order status in database
      const response = await fetch(`/api/orders/${orderId.trim()}`, {
        method: 'GET',
      });

      const data = await response.json();
      setResult({ 
        success: response.ok, 
        data, 
        status: response.status,
        action: 'check-order'
      });
    } catch (error) {
      setResult({ 
        success: false, 
        error: 'Failed to check order status',
        action: 'check-order'
      });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentFailureEmail = async () => {
    if (!orderId.trim()) {
      setResult({ success: false, error: 'Please enter an order ID' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Test payment failure email API
      const response = await fetch('/api/send-payment-failure-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderId.trim(),
          reason: 'Test payment failure - insufficient funds'
        }),
      });

      const data = await response.json();
      setResult({ 
        success: response.ok, 
        data, 
        status: response.status,
        action: 'test-failure-email'
      });
    } catch (error) {
      setResult({ 
        success: false, 
        error: 'Failed to test payment failure email',
        action: 'test-failure-email'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Webhook Testing Tool</h1>
        <p className="text-gray-600">Test payment success/failure webhooks and related functionality</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Configure and run webhook tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                type="text"
                placeholder="Enter order ID (without elixr_ prefix)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>

            <div>
              <Label>Test Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={testType === 'success' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestType('success')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Payment Success
                </Button>
                <Button
                  variant={testType === 'failure' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestType('failure')}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Payment Failure
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={testWebhook}
                disabled={loading || !orderId.trim()}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 mr-2" />
                )}
                Test {testType === 'success' ? 'Success' : 'Failure'} Webhook
              </Button>

              <Button
                onClick={checkOrder}
                disabled={loading || !orderId.trim()}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Check Order Status
              </Button>

              <Button
                onClick={testPaymentFailureEmail}
                disabled={loading || !orderId.trim()}
                variant="outline"
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                Test Failure Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Response from webhook and API calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  {result.status && (
                    <Badge variant="outline">
                      Status: {result.status}
                    </Badge>
                  )}
                  {result.testType && (
                    <Badge variant="secondary">
                      {result.testType}
                    </Badge>
                  )}
                  {result.action && (
                    <Badge variant="secondary">
                      {result.action}
                    </Badge>
                  )}
                </div>

                <div>
                  <Label>Response</Label>
                  <Textarea
                    value={JSON.stringify(result.data || result.error, null, 2)}
                    readOnly
                    className="mt-2 font-mono text-sm"
                    rows={10}
                  />
                </div>

                {result.webhookPayload && (
                  <div>
                    <Label>Webhook Payload Sent</Label>
                    <Textarea
                      value={JSON.stringify(result.webhookPayload, null, 2)}
                      readOnly
                      className="mt-2 font-mono text-sm"
                      rows={8}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No test results yet. Run a test to see results here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Testing Payment Success:</h4>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Enter a valid order ID from your database</li>
              <li>Select "Payment Success" test type</li>
              <li>Click "Test Success Webhook"</li>
              <li>Check that order status updates to "Payment Success"</li>
              <li>Verify that confirmation emails are sent</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Testing Payment Failure:</h4>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Enter a valid order ID from your database</li>
              <li>Select "Payment Failure" test type</li>
              <li>Click "Test Failure Webhook"</li>
              <li>Check that order status updates to "Payment Failed"</li>
              <li>Verify that failure notification emails are sent</li>
              <li>Test the "Test Failure Email" button separately</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Checking Results:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Use "Check Order Status" to verify database updates</li>
              <li>Check your email for notifications</li>
              <li>Monitor console logs for detailed debugging info</li>
              <li>Test the payment failure page: <code>/payment-failed?order_id=TEST&amount=299&reason=Test</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
