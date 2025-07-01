'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/apiUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DevProtectionWrapper } from '@/lib/dev-protection';

export default function TestEmailPage() {
  return (
    <DevProtectionWrapper>
      <TestEmailContent />
    </DevProtectionWrapper>
  );
}

function TestEmailContent() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEmail = async () => {
    if (!orderId.trim()) {
      setResult({ success: false, error: 'Please enter an order ID' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await apiPost('/api/send-order-email', {
        orderId: orderId.trim(),
        userEmail: '', // Will be fetched from database
        orderDetails: {}
      });
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Failed to send email request' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>📧 Test Order Email System</CardTitle>
          <CardDescription>
            Test the order confirmation email system by entering an existing order ID.
            The system will fetch the order details from the database and send confirmation
            emails to both the customer and admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="orderId" className="text-sm font-medium">
              Order ID
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

          <Button 
            onClick={testEmail} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Sending Emails...' : 'Send Test Emails'}
          </Button>

          {result && (
            <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <AlertDescription>
                {result.success ? (
                  <div className="space-y-2">
                    <div className="font-semibold text-green-700">✅ Email Test Results:</div>
                    <div className="space-y-1 text-sm">
                      <div>Customer Email: {result.userEmailSent ? '✅ Sent' : '❌ Failed'}</div>
                      <div>Admin Email: {result.adminEmailSent ? '✅ Sent' : '❌ Failed'}</div>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium">Errors:</div>
                          <ul className="list-disc list-inside">
                            {result.errors.map((error: string, index: number) => (
                              <li key={index} className="text-red-600">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-700">
                    <div className="font-semibold">❌ Email Test Failed</div>
                    <div className="text-sm mt-1">
                      {result.error || 'Unknown error occurred'}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <div className="font-medium">How to use:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a test order through the normal checkout process</li>
              <li>Complete the payment to generate a successful order</li>
              <li>Copy the order ID from the orders page or database</li>
              <li>Paste it above and click "Send Test Emails"</li>
              <li>Check your email (customer) and admin email for confirmations</li>
            </ol>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <div className="font-medium">What this tests:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Order data fetching from Supabase database</li>
              <li>Customer email generation and sending</li>
              <li>Admin notification email generation and sending</li>
              <li>Subscription vs regular order detection</li>
              <li>Error handling and reporting</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
