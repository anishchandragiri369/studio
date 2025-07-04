"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Zap, Database, Server, Users, ShoppingCart, Calendar, Settings, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { DevProtectionWrapper } from '@/lib/dev-protection';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failure' | 'warning';
  message?: string;
  duration?: number;
  details?: any;
}

interface TestCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  tests: TestResult[];
}

export default function ComprehensiveTestPage() {
  return (
    <DevProtectionWrapper>
      <ComprehensiveTestContent />
    </DevProtectionWrapper>
  );
}

function ComprehensiveTestContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [testCategories, setTestCategories] = useState<TestCategory[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [completedTests, setCompletedTests] = useState(0);
  const [totalTests, setTotalTests] = useState(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9002');

  // Initialize test categories
  useEffect(() => {
    const initialCategories: TestCategory[] = [
      {
        id: 'auth',
        name: 'Authentication & Auth Context',
        icon: <Users className="h-4 w-4" />,
        tests: [
          { id: 'auth-context', name: 'Auth Context State', status: 'pending' },
          { id: 'user-session', name: 'User Session Validation', status: 'pending' },
          { id: 'login-flow', name: 'Login Flow Test', status: 'pending' },
          { id: 'logout-flow', name: 'Logout Flow Test', status: 'pending' },
          { id: 'password-reset', name: 'Password Reset Flow', status: 'pending' },
        ]
      },
      {
        id: 'database',
        name: 'Database & Supabase',
        icon: <Database className="h-4 w-4" />,
        tests: [
          { id: 'supabase-connection', name: 'Supabase Connection', status: 'pending' },
          { id: 'delivery-schedule-table', name: 'Delivery Schedule Settings Table', status: 'pending' },
          { id: 'delivery-audit-table', name: 'Delivery Schedule Audit Table', status: 'pending' },
          { id: 'subscriptions-table', name: 'Subscriptions Table', status: 'pending' },
          { id: 'orders-table', name: 'Orders Table', status: 'pending' },
          { id: 'users-table', name: 'Users Table', status: 'pending' },
        ]
      },
      {
        id: 'delivery-schedule',
        name: 'Delivery Schedule System',
        icon: <Calendar className="h-4 w-4" />,
        tests: [
          { id: 'admin-delivery-api', name: 'Admin Delivery Schedule API', status: 'pending' },
          { id: 'admin-audit-api', name: 'Admin Audit API', status: 'pending' },
          { id: 'delivery-scheduler', name: 'Delivery Scheduler Integration', status: 'pending' },
          { id: 'schedule-calculation', name: 'Schedule Calculation Logic', status: 'pending' },
          { id: 'settings-persistence', name: 'Settings Persistence', status: 'pending' },
        ]
      },
      {
        id: 'subscriptions',
        name: 'Subscription Management',
        icon: <RefreshCw className="h-4 w-4" />,
        tests: [
          { id: 'subscription-create', name: 'Subscription Creation API', status: 'pending' },
          { id: 'subscription-pause', name: 'Subscription Pause API', status: 'pending' },
          { id: 'subscription-reactivate', name: 'Subscription Reactivation API', status: 'pending' },
          { id: 'subscription-renewal', name: 'Subscription Renewal API', status: 'pending' },
          { id: 'delivery-management', name: 'Delivery Management API', status: 'pending' },
          { id: 'schedule-regeneration', name: 'Schedule Regeneration API', status: 'pending' },
        ]
      },
      {
        id: 'orders',
        name: 'Order Management',
        icon: <ShoppingCart className="h-4 w-4" />,
        tests: [
          { id: 'order-create', name: 'Order Creation API', status: 'pending' },
          { id: 'order-webhook', name: 'Payment Webhook Processing', status: 'pending' },
          { id: 'order-completion', name: 'Order Completion Flow', status: 'pending' },
          { id: 'order-analytics', name: 'Order Analytics API', status: 'pending' },
        ]
      },
      {
        id: 'admin',
        name: 'Admin Features',
        icon: <Settings className="h-4 w-4" />,
        tests: [
          { id: 'admin-auth', name: 'Admin Authentication', status: 'pending' },
          { id: 'admin-delivery-ui', name: 'Admin Delivery Schedule UI', status: 'pending' },
          { id: 'admin-permissions', name: 'Admin Permissions', status: 'pending' },
        ]
      },
      {
        id: 'notifications',
        name: 'Notifications & Emails',
        icon: <Mail className="h-4 w-4" />,
        tests: [
          { id: 'subscription-email', name: 'Subscription Email API', status: 'pending' },
          { id: 'order-email', name: 'Order Email API', status: 'pending' },
          { id: 'payment-failure-email', name: 'Payment Failure Email API', status: 'pending' },
          { id: 'whatsapp-integration', name: 'WhatsApp Integration', status: 'pending' },
        ]
      },
      {
        id: 'features',
        name: 'Core Features',
        icon: <Zap className="h-4 w-4" />,
        tests: [
          { id: 'fruit-bowls', name: 'Fruit Bowls Feature', status: 'pending' },
          { id: 'rating-system', name: 'Rating System', status: 'pending' },
          { id: 'transfers', name: 'Subscription Transfers', status: 'pending' },
          { id: 'analytics', name: 'Analytics Integration', status: 'pending' },
        ]
      },
    ];

    setTestCategories(initialCategories);
    setTotalTests(initialCategories.reduce((acc, cat) => acc + cat.tests.length, 0));
  }, []);

  const updateSingleTest = (test: TestResult, testId: string, updates: Partial<TestResult>): TestResult => {
    if (test.id !== testId) return test;
    
    const updatedTest = { ...test, ...updates };
    if (updates.status && ['success', 'failure', 'warning'].includes(updates.status)) {
      setCompletedTests(prev => prev + 1);
    }
    return updatedTest;
  };

  const updateCategoryTests = (category: TestCategory, categoryId: string, testId: string, updates: Partial<TestResult>): TestCategory => {
    if (category.id !== categoryId) return category;
    
    const updatedTests = category.tests.map(test => updateSingleTest(test, testId, updates));
    return { ...category, tests: updatedTests };
  };

  const updateTestResult = (categoryId: string, testId: string, updates: Partial<TestResult>) => {
    setTestCategories(prev => prev.map(category => updateCategoryTests(category, categoryId, testId, updates)));
  };

  const runTest = async (categoryId: string, testId: string, testFunction: () => Promise<Partial<TestResult>>) => {
    const startTime = Date.now();
    updateTestResult(categoryId, testId, { status: 'running' });
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      updateTestResult(categoryId, testId, { 
        ...result, 
        duration,
        status: result.status || 'success'
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestResult(categoryId, testId, { 
        status: 'failure', 
        message: error.message || 'Test failed',
        duration 
      });
    }
  };

  // Test functions
  const testAuthContext = async (): Promise<Partial<TestResult>> => {
    if (!user) {
      return { status: 'warning', message: 'No user logged in - please login to test auth features' };
    }
    return { status: 'success', message: `User authenticated: ${user.email}`, details: { userId: user.id } };
  };

  const testSupabaseConnection = async (): Promise<Partial<TestResult>> => {
    const response = await fetch(`${API_BASE}/api/admin/delivery-schedule`);
    if (response.ok) {
      return { status: 'success', message: 'Supabase connection working' };
    }
    return { status: 'failure', message: `Supabase connection failed: ${response.status}` };
  };

  const testDeliveryScheduleTable = async (): Promise<Partial<TestResult>> => {
    const response = await fetch(`${API_BASE}/api/admin/delivery-schedule`);
    if (response.ok) {
      const data = await response.json();
      return { 
        status: 'success', 
        message: `Found ${data.length} delivery schedule settings`,
        details: data 
      };
    }
    return { status: 'failure', message: `Delivery schedule table test failed: ${response.status}` };
  };

  const testDeliveryAuditTable = async (): Promise<Partial<TestResult>> => {
    const response = await fetch(`${API_BASE}/api/admin/delivery-schedule/audit`);
    if (response.ok) {
      const data = await response.json();
      return { 
        status: 'success', 
        message: `Found ${data.audit_history?.length || 0} audit records`,
        details: data 
      };
    }
    return { status: 'failure', message: `Delivery audit table test failed: ${response.status}` };
  };

  const testSubscriptionAPI = async (endpoint: string): Promise<Partial<TestResult>> => {
    const response = await fetch(`${API_BASE}/api/subscriptions/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    if (response.status === 400 || response.status === 401) {
      return { status: 'warning', message: 'API endpoint exists but requires valid data/auth' };
    }
    if (response.ok) {
      return { status: 'success', message: 'API endpoint working' };
    }
    return { status: 'failure', message: `API test failed: ${response.status}` };
  };

  const testOrderAPI = async (endpoint: string): Promise<Partial<TestResult>> => {
    const response = await fetch(`${API_BASE}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    if (response.status === 400 || response.status === 401) {
      return { status: 'warning', message: 'API endpoint exists but requires valid data/auth' };
    }
    if (response.ok) {
      return { status: 'success', message: 'API endpoint working' };
    }
    return { status: 'failure', message: `API test failed: ${response.status}` };
  };

  const testEmailAPI = async (endpoint: string): Promise<Partial<TestResult>> => {
    const response = await fetch(`${API_BASE}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true })
    });
    
    if (response.status === 400 || response.status === 401) {
      return { status: 'warning', message: 'Email API endpoint exists but requires valid data' };
    }
    if (response.ok) {
      return { status: 'success', message: 'Email API working' };
    }
    return { status: 'failure', message: `Email API test failed: ${response.status}` };
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setCompletedTests(0);

    // Auth tests
    await runTest('auth', 'auth-context', testAuthContext);
    await runTest('auth', 'user-session', async () => {
      if (user?.id) {
        return { status: 'success', message: 'User session active' };
      }
      return { status: 'warning', message: 'No active user session' };
    });

    // Database tests
    await runTest('database', 'supabase-connection', testSupabaseConnection);
    await runTest('database', 'delivery-schedule-table', testDeliveryScheduleTable);
    await runTest('database', 'delivery-audit-table', testDeliveryAuditTable);

    // Delivery schedule tests
    await runTest('delivery-schedule', 'admin-delivery-api', async () => {
      const response = await fetch(`${API_BASE}/api/admin/delivery-schedule`);
      if (response.ok) {
        return { status: 'success', message: 'Admin delivery API working' };
      }
      return { status: 'failure', message: `Admin delivery API failed: ${response.status}` };
    });

    await runTest('delivery-schedule', 'admin-audit-api', async () => {
      const response = await fetch(`${API_BASE}/api/admin/delivery-schedule/audit`);
      if (response.ok) {
        return { status: 'success', message: 'Admin audit API working' };
      }
      return { status: 'failure', message: `Admin audit API failed: ${response.status}` };
    });

    // Subscription tests
    await runTest('subscriptions', 'subscription-create', () => testSubscriptionAPI('create'));
    await runTest('subscriptions', 'subscription-pause', () => testSubscriptionAPI('pause'));
    await runTest('subscriptions', 'subscription-reactivate', () => testSubscriptionAPI('reactivate'));
    await runTest('subscriptions', 'subscription-renewal', () => testSubscriptionAPI('renewal-check'));
    await runTest('subscriptions', 'delivery-management', () => testSubscriptionAPI('delivery-management'));
    await runTest('subscriptions', 'schedule-regeneration', () => testSubscriptionAPI('regenerate-schedule'));

    // Order tests
    await runTest('orders', 'order-create', () => testOrderAPI('orders/create'));
    await runTest('orders', 'order-webhook', () => testOrderAPI('webhook/payment-confirm'));

    // Email tests
    await runTest('notifications', 'subscription-email', () => testEmailAPI('send-subscription-email'));
    await runTest('notifications', 'order-email', () => testEmailAPI('send-order-email'));
    await runTest('notifications', 'payment-failure-email', () => testEmailAPI('send-payment-failure-email'));

    // Feature tests
    await runTest('features', 'fruit-bowls', async () => {
      const response = await fetch(`${API_BASE}/api/test-features`);
      if (response.status === 404) {
        return { status: 'warning', message: 'Test features endpoint not found' };
      }
      return { status: 'success', message: 'Features test completed' };
    });

    setIsRunning(false);
    toast({
      title: "Tests Completed",
      description: `Completed ${completedTests} out of ${totalTests} tests`,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: 'bg-green-100 text-green-800',
      failure: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return variants[status] || variants.pending;
  };

  const getOverallStats = () => {
    const allTests = testCategories.flatMap(cat => cat.tests);
    const successful = allTests.filter(test => test.status === 'success').length;
    const failed = allTests.filter(test => test.status === 'failure').length;
    const warnings = allTests.filter(test => test.status === 'warning').length;
    const pending = allTests.filter(test => test.status === 'pending').length;
    
    return { successful, failed, warnings, pending, total: allTests.length };
  };

  const stats = getOverallStats();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Comprehensive System Test Suite</h1>
          <p className="text-gray-600">
            Complete integration testing for Elixr Studio delivery schedule system and all features
          </p>
        </div>

        {/* Stats Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Test Overview
            </CardTitle>
            <CardDescription>Overall system test status and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {completedTests}/{totalTests}</span>
                <span>{Math.round((completedTests / totalTests) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedTests / totalTests) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Categories */}
        <Tabs defaultValue={testCategories[0]?.id} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {testCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                {category.icon}
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {testCategories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {category.icon}
                    {category.name}
                  </CardTitle>
                  <CardDescription>
                    Test results for {category.name.toLowerCase()} functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.tests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <div className="font-medium">{test.name}</div>
                            {test.message && (
                              <div className="text-sm text-gray-600">{test.message}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.duration && (
                            <span className="text-xs text-gray-500">{test.duration}ms</span>
                          )}
                          <Badge className={getStatusBadge(test.status)}>
                            {test.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>API Base URL:</strong> {API_BASE}
              </div>
              <div>
                <strong>User Status:</strong> {user ? `Logged in as ${user.email}` : 'Not logged in'}
              </div>
              <div>
                <strong>Test Environment:</strong> Development
              </div>
              <div>
                <strong>Total Test Categories:</strong> {testCategories.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
            <CardDescription>Access key pages and admin interfaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open('/admin/delivery-schedule', '_blank')}>
                Admin Delivery Settings
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/subscriptions', '_blank')}>
                Subscriptions
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/orders', '_blank')}>
                Orders
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/test-subscription', '_blank')}>
                Test Subscription
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/test-webhook', '_blank')}>
                Test Webhook
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/fruit-bowls', '_blank')}>
                Fruit Bowls
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/reviews', '_blank')}>
                Reviews
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open('/transfers', '_blank')}>
                Transfers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
