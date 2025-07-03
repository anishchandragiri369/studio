'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  UserPlus, 
  UserMinus,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface AnalyticsData {
  revenue_trends: Array<{
    date: string;
    total_revenue: number;
    gift_revenue: number;
    family_revenue: number;
    corporate_revenue: number;
    transfer_fees: number;
  }>;
  customer_acquisition: Array<{
    period: string;
    new_customers: number;
    gift_acquisitions: number;
    family_acquisitions: number;
    corporate_acquisitions: number;
    conversion_rate: number;
  }>;
  churn_analysis: Array<{
    period: string;
    churned_customers: number;
    churn_rate: number;
    retention_rate: number;
    churn_reasons: Array<{
      reason: string;
      count: number;
    }>;
  }>;
  summary: {
    total_revenue: number;
    total_new_customers: number;
    average_churn_rate: number;
    growth_rate: number;
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function SubscriptionAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'acquisition' | 'churn'>('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, granularity]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const response = await fetch(
        `/api/subscription-analytics?startDate=${startDate}&endDate=${endDate}&granularity=${granularity}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const result = await response.json();
      setAnalyticsData(result.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const downloadReport = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const response = await fetch('/api/subscription-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          granularity,
          metrics: ['revenue', 'acquisition', 'churn']
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscription-analytics-${startDate}-to-${endDate}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-3 text-lg text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              No analytics data available. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={granularity} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setGranularity(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={downloadReport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData.summary.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={analyticsData.summary.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {analyticsData.summary.growth_rate >= 0 ? '+' : ''}
                {formatPercentage(analyticsData.summary.growth_rate)}
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary.total_new_customers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Acquired customers in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(analyticsData.summary.average_churn_rate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average monthly churn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(100 - (analyticsData.summary.average_churn_rate || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer retention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2">
        {(['revenue', 'acquisition', 'churn'] as const).map((metric) => (
          <Button
            key={metric}
            variant={activeMetric === metric ? 'default' : 'outline'}
            onClick={() => setActiveMetric(metric)}
            className="capitalize"
          >
            {metric}
          </Button>
        ))}
      </div>

      {/* Charts */}
      {activeMetric === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Daily revenue breakdown by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.revenue_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total_revenue" 
                    stackId="1" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gift_revenue" 
                    stackId="2" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="corporate_revenue" 
                    stackId="3" 
                    stroke="#F59E0B" 
                    fill="#F59E0B" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Sources</CardTitle>
              <CardDescription>Revenue distribution by channel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { 
                        name: 'Regular Subscriptions', 
                        value: analyticsData.revenue_trends.reduce((sum, day) => sum + day.total_revenue, 0) 
                      },
                      { 
                        name: 'Gift Subscriptions', 
                        value: analyticsData.revenue_trends.reduce((sum, day) => sum + day.gift_revenue, 0) 
                      },
                      { 
                        name: 'Corporate', 
                        value: analyticsData.revenue_trends.reduce((sum, day) => sum + day.corporate_revenue, 0) 
                      },
                      { 
                        name: 'Transfer Fees', 
                        value: analyticsData.revenue_trends.reduce((sum, day) => sum + day.transfer_fees, 0) 
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {activeMetric === 'acquisition' && (
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
            <CardDescription>New customer acquisition by channel</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.customer_acquisition}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="new_customers" fill="#3B82F6" name="Regular" />
                <Bar dataKey="gift_acquisitions" fill="#10B981" name="Gift" />
                <Bar dataKey="family_acquisitions" fill="#F59E0B" name="Family" />
                <Bar dataKey="corporate_acquisitions" fill="#EF4444" name="Corporate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {activeMetric === 'churn' && analyticsData.churn_analysis.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Churn Trends</CardTitle>
              <CardDescription>Monthly churn and retention rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.churn_analysis}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                  <Line 
                    type="monotone" 
                    dataKey="churn_rate" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Churn Rate"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="retention_rate" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Retention Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Churn Reasons</CardTitle>
              <CardDescription>Most common reasons for cancellation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.churn_analysis[0]?.churn_reasons.slice(0, 5).map((reason, index) => (
                  <div key={reason.reason} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{reason.reason}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ 
                            width: `${(reason.count / Math.max(...analyticsData.churn_analysis[0].churn_reasons.map(r => r.count))) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{reason.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
