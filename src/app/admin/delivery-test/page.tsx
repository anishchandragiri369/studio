"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, TestTube, Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';

export default function AdminDeliveryTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const testDeliveryScheduler = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/test-delivery-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency: 'daily', // Test daily delivery (excluding Sundays)
          duration: 2 // 2 months of daily deliveries
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Failed to test delivery scheduler');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/daily-subscription-report?date=${reportDate}`);
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.message || 'Failed to generate report');
        }
      } else {
        // File download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Elixr_Subscription_Report_${reportDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setResult({ message: 'Report downloaded successfully' });
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Delivery Scheduling Test Page
          </h1>
          <p className="text-muted-foreground">
            Test the new 6 PM cutoff delivery scheduling system and generate reports
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delivery Scheduler Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TestTube className="w-5 h-5 mr-2" />
                Test Delivery Scheduler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test the 6 PM cutoff rule with daily deliveries (excluding Sundays)
              </p>
              <Button 
                onClick={testDeliveryScheduler} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Testing...' : 'Run Delivery Test'}
              </Button>
            </CardContent>
          </Card>

          {/* Daily Report Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Generate Daily Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reportDate">Report Date</Label>
                <Input
                  id="reportDate"
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>
              <Button 
                onClick={generateDailyReport} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Download Report'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Display */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.scenarios ? (
                // Delivery scheduler test results
                <div className="space-y-4">
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Test Parameters:</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Frequency: {result.testParameters.frequency}
                      </Badge>
                      <Badge variant="outline">
                        Duration: {result.testParameters.duration} months
                      </Badge>
                    </div>
                    {result.note && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                        <strong>Note:</strong> {result.note}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Scenarios:</h4>
                    {result.scenarios.map((scenario: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{scenario.scenario}</h5>
                          <div className="flex gap-2">
                            <Badge variant={scenario.isAfterCutoff ? "destructive" : "default"}>
                              {scenario.isAfterCutoff ? 'After 6 PM' : 'Before 6 PM'}
                            </Badge>
                            {scenario.hasSundayDeliveries === false && (
                              <Badge variant="secondary">No Sundays</Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                          <p><strong>Order Time:</strong> {scenario.orderTime} ({scenario.orderDay})</p>
                          <p><strong>First Delivery:</strong> {scenario.firstDeliveryDate} ({scenario.firstDeliveryDay})</p>
                          <p><strong>Total Deliveries:</strong> {scenario.totalDeliveries}</p>
                          <p className="md:col-span-2"><strong>Period:</strong> {scenario.deliveryPeriod}</p>
                        </div>
                        
                        {scenario.firstTenDeliveries && (
                          <div>
                            <h6 className="font-medium text-sm mb-2">First 10 Delivery Dates:</h6>
                            <div className="grid grid-cols-5 gap-1 text-xs">
                              {scenario.firstTenDeliveries.map((delivery: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={`p-1 rounded text-center ${
                                    delivery.isSunday 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}
                                >
                                  {delivery.date}
                                </div>
                              ))}
                            </div>
                            {scenario.firstTenDeliveries.some((d: any) => d.isSunday) && (
                              <p className="text-xs text-red-600 mt-1">
                                ⚠️ Red dates indicate Sundays (should not appear in actual delivery schedule)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : result.reportDate ? (
                // Daily report results
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Report Date</p>
                      <p className="font-semibold">{result.reportDate}</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-sm text-muted-foreground">Total Deliveries</p>
                      <p className="font-semibold">{result.totalDeliveries}</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="font-semibold">₹{result.totalRevenue}</p>
                    </div>
                  </div>
                  
                  {result.orders && result.orders.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Scheduled Deliveries:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.orders.map((order: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{order.customerEmail}</span>
                              <Badge variant="outline">₹{order.totalAmount}</Badge>
                            </div>
                            <p className="text-muted-foreground text-xs">
                              {order.items?.length || 0} items • Order #{order.orderId}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Simple message result
                <p className="text-green-600">{result.message}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Scheduling Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-800">Before 6 PM</h4>
                </div>
                <p className="text-sm text-green-700">
                  Orders placed before 6 PM will have their first delivery scheduled for the next day (skipping Sunday if applicable).
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Example: Order on June 15th at 5 PM → First delivery June 16th
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <h4 className="font-semibold text-yellow-800">After 6 PM</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Orders placed after 6 PM will have their first delivery scheduled for the day after next (skipping Sunday if applicable).
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Example: Order on June 15th at 8 PM → First delivery June 17th
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Delivery Patterns</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Daily Subscriptions:</strong> Deliver every day except Sunday</li>
                <li>• <strong>Weekly/Monthly Subscriptions:</strong> Deliver every other day (1-day gap) except Sunday</li>
                <li>• <strong>Sunday Exclusion:</strong> No deliveries on Sundays, automatically moved to Monday</li>
                <li>• <strong>Daily Pattern Example:</strong> Mon → Tue → Wed → Thu → Fri → Sat → (skip Sun) → Mon</li>
                <li>• <strong>Weekly/Monthly Pattern Example:</strong> Mon → Wed → Fri → (skip Sun) → Tue → Thu → Sat</li>
              </ul>
            </div>
            
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2">Test Scenarios</h4>
              <div className="space-y-2">
                <div>
                  <h5 className="font-medium text-purple-800">Daily Subscription:</h5>
                  <ul className="text-sm text-purple-700 space-y-1 ml-4">
                    <li>• <strong>June 15th @ 5 PM:</strong> Before cutoff → Daily from June 16th (Mon, Tue, Wed, Thu, Fri, Sat, Mon...)</li>
                    <li>• <strong>June 15th @ 8 PM:</strong> After cutoff → Daily from June 17th (Tue, Wed, Thu, Fri, Sat, Mon...)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-purple-800">Weekly/Monthly Subscription:</h5>
                  <ul className="text-sm text-purple-700 space-y-1 ml-4">
                    <li>• <strong>June 15th @ 5 PM:</strong> Before cutoff → Gap pattern from June 16th (16th, 18th, 20th, 22nd...)</li>
                    <li>• <strong>June 15th @ 8 PM:</strong> After cutoff → Gap pattern from June 17th (17th, 19th, 21st, 24th...)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
