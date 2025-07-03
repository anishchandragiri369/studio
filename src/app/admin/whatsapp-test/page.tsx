'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Send, 
  TestTube, 
  CheckCircle, 
  AlertCircle,
  Phone,
  User,
  Zap,
  Settings
} from 'lucide-react';

interface TestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  testType?: string;
  phoneNumber?: string;
}

interface WhatsAppConfig {
  configured: boolean;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  apiVersion: string;
  status: string;
}

export default function WhatsAppTestDashboard() {
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [customerName, setCustomerName] = useState('Test User');
  const [selectedMessageType, setSelectedMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [configStatus, setConfigStatus] = useState<WhatsAppConfig | null>(null);

  // Load WhatsApp configuration status on component mount
  useEffect(() => {
    const loadConfigStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp/config');
        if (response.ok) {
          const config = await response.json();
          setConfigStatus(config);
        }
      } catch (error) {
        console.error('Failed to load WhatsApp config:', error);
        // Fallback to dummy status
        setConfigStatus({
          configured: false,
          accessToken: 'DUMMY_*****',
          phoneNumberId: 'DUMMY_*****', 
          businessAccountId: 'DUMMY_*****',
          webhookVerifyToken: 'DUMMY_*****',
          apiVersion: 'v17.0',
          status: 'Using dummy credentials'
        });
      }
    };

    loadConfigStatus();
  }, []);

  const messageTypes = [
    { value: 'churn_prevention', label: 'Churn Prevention', description: 'High-risk customer retention message' },
    { value: 'pause_reminder', label: 'Pause Reminder', description: 'Remind before 6 PM cutoff' },
    { value: 'delivery_feedback', label: 'Delivery Feedback', description: 'Post-delivery rating request' },
    { value: 'seasonal_promotion', label: 'Seasonal Promotion', description: 'Marketing offers and promotions' },
    { value: 'order_confirmation', label: 'Order Confirmation', description: 'Subscription confirmation message' },
    { value: 'payment_failure', label: 'Payment Failure', description: 'Failed payment notification' },
    { value: 'welcome', label: 'Welcome Message', description: 'New subscriber onboarding' }
  ];

  const sendTestMessage = async () => {
    if (!selectedMessageType || !phoneNumber) {
      setTestResult({
        success: false,
        error: 'Please select a message type and enter a phone number'
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          messageType: selectedMessageType,
          customerName,
          data: getTestData(selectedMessageType)
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickTest = async (testType: string) => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/whatsapp/send?test=${testType}&phone=${phoneNumber}`);
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTestData = (messageType: string) => {
    switch (messageType) {
      case 'churn_prevention':
        return { churnRisk: 85 };
      case 'pause_reminder':
        return { nextDeliveryDate: 'July 15, 2025' };
      case 'delivery_feedback':
        return { deliveryId: 'del_test_123' };
      case 'seasonal_promotion':
        return { promotion: 'Summer Special: 30% off all green juices! 🥬' };
      case 'order_confirmation':
        return { 
          orderDetails: { 
            plan: 'Weekly Kickstarter', 
            nextDelivery: 'July 10, 2025' 
          } 
        };
      case 'payment_failure':
        return { amount: 2697 };
      default:
        return {};
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          WhatsApp Integration Test Dashboard
        </h1>
        <p className="text-gray-600">
          Test WhatsApp Business API integration with dummy credentials
        </p>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Message Configuration
          </CardTitle>
          <CardDescription>
            Configure test message parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="name">Customer Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Test User"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="messageType">Message Type</Label>
            <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a message type to test" />
              </SelectTrigger>
              <SelectContent>
                {messageTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={sendTestMessage} 
            disabled={isLoading || !selectedMessageType}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Test Message
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Tests
          </CardTitle>
          <CardDescription>
            Run predefined test scenarios with sample data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {messageTypes.map((type) => (
              <Button
                key={type.value}
                variant="outline"
                onClick={() => runQuickTest(type.value)}
                disabled={isLoading}
                className="h-auto p-4 text-left"
              >
                <div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  {testResult.success ? (
                    <div>
                      <div className="font-medium text-green-700">
                        Message sent successfully! ✅
                      </div>
                      {testResult.messageId && (
                        <div className="text-sm text-gray-600 mt-1">
                          Message ID: {testResult.messageId}
                        </div>
                      )}
                      {testResult.testType && (
                        <div className="text-sm text-gray-600">
                          Test Type: {testResult.testType}
                        </div>
                      )}
                      {testResult.phoneNumber && (
                        <div className="text-sm text-gray-600">
                          Sent to: {testResult.phoneNumber}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-red-700">
                        Failed to send message ❌
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        Error: {testResult.error}
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Information</CardTitle>
          <CardDescription>
            WhatsApp Business API configuration and endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">
                {configStatus?.configured ? 'Production Configuration' : 'Using Dummy Credentials'}
              </span>
            </div>
            <p className="text-sm text-yellow-700">
              {configStatus?.configured 
                ? 'WhatsApp Business API is configured with real credentials.'
                : 'This integration is configured with dummy credentials. Replace with real WhatsApp Business API credentials in production.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">API Endpoints</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• POST /api/whatsapp/send - Send messages</li>
                <li>• GET /api/whatsapp/send - Test endpoint</li>
                <li>• POST /api/whatsapp/webhook - Receive messages</li>
                <li>• GET /api/whatsapp/webhook - Webhook verification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Configuration</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Access Token: {configStatus?.accessToken || 'DUMMY_*****'}</li>
                <li>• Phone Number ID: {configStatus?.phoneNumberId || 'DUMMY_*****'}</li>
                <li>• Business Account: {configStatus?.businessAccountId || 'DUMMY_*****'}</li>
                <li>• API Version: {configStatus?.apiVersion || 'v17.0'}</li>
                <li>• Status: {configStatus?.status || 'Loading...'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
