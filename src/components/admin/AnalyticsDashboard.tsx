"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Ticket, 
  DollarSign, 
  Calendar,
  Target,
  Award,
  Zap,
  RefreshCw,
  Download
} from 'lucide-react';

interface CouponAnalytics {
  couponCode: string;
  usageCount: number;
  totalDiscount: number;
  revenue: number;
  conversionRate: number;
}

interface ReferralAnalytics {
  totalReferrals: number;
  successfulReferrals: number;
  totalRewardsPaid: number;
  topReferrers: Array<{
    userId: string;
    referralCode: string;
    referralsCount: number;
    totalEarned: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    referrals: number;
    rewards: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const [couponData, setCouponData] = useState<CouponAnalytics[]>([]);
  const [referralData, setReferralData] = useState<ReferralAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [couponResponse, referralResponse] = await Promise.all([
        fetch(`/api/analytics/coupons?days=${dateRange}`),
        fetch(`/api/analytics/referrals?days=${dateRange}`)
      ]);

      if (couponResponse.ok) {
        const couponResult = await couponResponse.json();
        setCouponData(couponResult.data || []);
      }

      if (referralResponse.ok) {
        const referralResult = await referralResponse.json();
        setReferralData(referralResult.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCouponUsage = couponData.reduce((sum, item) => sum + item.usageCount, 0);
  const totalCouponDiscount = couponData.reduce((sum, item) => sum + item.totalDiscount, 0);
  const totalCouponRevenue = couponData.reduce((sum, item) => sum + item.revenue, 0);

  const exportData = () => {
    const data = {
      coupons: couponData,
      referrals: referralData,
      summary: {
        totalCouponUsage,
        totalCouponDiscount,
        totalCouponRevenue,
        dateRange: `${dateRange} days`
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track coupon performance and referral success
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2">
        {['7', '30', '90', '365'].map((days) => (
          <Button
            key={days}
            variant={dateRange === days ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange(days)}
          >
            {days === '365' ? '1 Year' : `${days} Days`}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Coupon Usage</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCouponUsage}</div>
                <p className="text-xs text-muted-foreground">
                  Last {dateRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalCouponDiscount.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  Savings provided
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {referralData?.successfulReferrals || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  New customers acquired
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rewards Paid</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{referralData?.totalRewardsPaid.toFixed(0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  To referrers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Impact Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Impact</CardTitle>
              <CardDescription>
                Comparison of revenue generated vs discounts given
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={couponData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="couponCode" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `₹${Number(value).toFixed(0)}`, 
                      name === 'revenue' ? 'Revenue' : 'Discount'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#0088FE" name="revenue" />
                  <Bar dataKey="totalDiscount" fill="#FF8042" name="totalDiscount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          {/* Coupon Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={couponData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ couponCode, percent }) => 
                        `${couponCode} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="usageCount"
                    >
                      {couponData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={couponData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="couponCode" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Conversion Rate']} />
                    <Bar dataKey="conversionRate" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Coupon Table */}
          <Card>
            <CardHeader>
              <CardTitle>Coupon Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Coupon Code</th>
                      <th className="text-left p-2">Usage Count</th>
                      <th className="text-left p-2">Total Discount</th>
                      <th className="text-left p-2">Revenue Generated</th>
                      <th className="text-left p-2">Conversion Rate</th>
                      <th className="text-left p-2">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponData.map((coupon) => {
                      const roi = coupon.totalDiscount > 0 
                        ? ((coupon.revenue - coupon.totalDiscount) / coupon.totalDiscount * 100)
                        : 0;
                      
                      return (
                        <tr key={coupon.couponCode} className="border-b">
                          <td className="p-2 font-medium">{coupon.couponCode}</td>
                          <td className="p-2">{coupon.usageCount}</td>
                          <td className="p-2">₹{coupon.totalDiscount.toFixed(0)}</td>
                          <td className="p-2">₹{coupon.revenue.toFixed(0)}</td>
                          <td className="p-2">{coupon.conversionRate.toFixed(1)}%</td>
                          <td className="p-2">
                            <Badge variant={roi > 0 ? 'default' : 'destructive'}>
                              {roi.toFixed(0)}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-6">
          {/* Referral Trends */}
          {referralData?.monthlyTrends && (
            <Card>
              <CardHeader>
                <CardTitle>Referral Trends</CardTitle>
                <CardDescription>Monthly referral activity and rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={referralData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="referrals" 
                      stackId="1" 
                      stroke="#0088FE" 
                      fill="#0088FE" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="rewards" 
                      stackId="2" 
                      stroke="#00C49F" 
                      fill="#00C49F" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Referrers */}
          {referralData?.topReferrers && (
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Users who have brought the most referrals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {referralData.topReferrers.slice(0, 10).map((referrer, index) => (
                    <div key={referrer.userId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{referrer.referralCode}</p>
                          <p className="text-sm text-muted-foreground">
                            {referrer.referralsCount} referrals
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ₹{referrer.totalEarned.toFixed(0)}
                        </p>
                        <p className="text-sm text-muted-foreground">earned</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
