"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Package, 
  Tag,
  Settings,
  BarChart3,
  PieChart
} from 'lucide-react';

interface SubscriptionAnalyticsProps {
  orders: any[];
}

export default function SubscriptionAnalytics({ orders }: SubscriptionAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (orders.length > 0) {
      calculateSubscriptionAnalytics();
    }
  }, [orders]);

  const calculateSubscriptionAnalytics = () => {
    const subscriptionOrders = orders.filter(order => order.order_type === 'subscription');
    
    // Category breakdown
    const categoryStats: { [key: string]: number } = {};
    const customizedCount = subscriptionOrders.filter(order => 
      order.subscription_info?.selectedJuices?.length > 0 && 
      (!order.subscription_info?.selectedCategory || order.subscription_info?.selectedCategory === 'custom')
    ).length;
    
    const standardCount = subscriptionOrders.filter(order => 
      !order.subscription_info?.selectedJuices?.length && 
      !order.subscription_info?.selectedCategory
    ).length;

    subscriptionOrders.forEach(order => {
      if (order.subscription_info?.selectedCategory && order.subscription_info.selectedCategory !== 'custom') {
        const category = order.subscription_info.selectedCategory;
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      }
    });

    // Plan frequency breakdown
    const frequencyStats: { [key: string]: number } = {};
    subscriptionOrders.forEach(order => {
      const frequency = order.subscription_info?.planFrequency || 'unknown';
      frequencyStats[frequency] = (frequencyStats[frequency] || 0) + 1;
    });

    // Revenue by subscription type
    const categoryRevenue: { [key: string]: number } = {};
    const customizedRevenue = subscriptionOrders
      .filter(order => 
        order.subscription_info?.selectedJuices?.length > 0 && 
        (!order.subscription_info?.selectedCategory || order.subscription_info?.selectedCategory === 'custom')
      )
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    
    const standardRevenue = subscriptionOrders
      .filter(order => 
        !order.subscription_info?.selectedJuices?.length && 
        !order.subscription_info?.selectedCategory
      )
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    subscriptionOrders.forEach(order => {
      if (order.subscription_info?.selectedCategory && order.subscription_info.selectedCategory !== 'custom') {
        const category = order.subscription_info.selectedCategory;
        categoryRevenue[category] = (categoryRevenue[category] || 0) + (order.total_amount || 0);
      }
    });

    setAnalytics({
      totalSubscriptions: subscriptionOrders.length,
      categoryBased: Object.values(categoryStats).reduce((sum, count) => sum + count, 0),
      customized: customizedCount,
      standard: standardCount,
      categoryBreakdown: categoryStats,
      frequencyBreakdown: frequencyStats,
      categoryRevenue,
      customizedRevenue,
      standardRevenue,
      totalSubscriptionRevenue: subscriptionOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    });
  };

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subscription analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Subscription Analytics
          </CardTitle>
          <CardDescription>
            Detailed insights into subscription patterns and category usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Subscriptions</p>
                    <p className="text-2xl font-bold">{analytics.totalSubscriptions}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category-Based</p>
                    <p className="text-2xl font-bold">{analytics.categoryBased}</p>
                  </div>
                  <Tag className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customized</p>
                    <p className="text-2xl font-bold">{analytics.customized}</p>
                  </div>
                  <Settings className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Standard</p>
                    <p className="text-2xl font-bold">{analytics.standard}</p>
                  </div>
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          {Object.keys(analytics.categoryBreakdown).length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-600" />
                Category Usage
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                  <Card key={category}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium capitalize">{category}</p>
                          <p className="text-sm text-muted-foreground">
                            {typeof count === 'number'
                              ? `${count} subscription${count !== 1 ? 's' : ''}`
                              : 'N/A'}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {formatCurrency(analytics.categoryRevenue[category] || 0)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Frequency Breakdown */}
          <div className="mb-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Plan Frequency Distribution
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(analytics.frequencyBreakdown).map(([frequency, count]) => (
                <Card key={frequency}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{frequency}</p>
                        <p className="text-sm text-muted-foreground">
                          {typeof count === 'number'
                            ? `${count} subscription${count !== 1 ? 's' : ''}`
                            : 'N/A'}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {typeof count === 'number'
                          ? `${Math.round((count / analytics.totalSubscriptions) * 100)}%`
                          : 'N/A'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Revenue by Subscription Type
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Tag className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Category-Based</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(Object.values(analytics.categoryRevenue).reduce((sum: number, revenue: unknown) => sum + (typeof revenue === 'number' ? revenue : 0), 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Settings className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Customized</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(analytics.customizedRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Standard</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatCurrency(analytics.standardRevenue)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 