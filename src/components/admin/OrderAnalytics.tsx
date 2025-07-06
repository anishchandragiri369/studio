"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface OrderAnalyticsProps {
  stats: any;
  dateFrom?: string;
  dateTo?: string;
}

export default function OrderAnalytics({ stats, dateFrom, dateTo }: OrderAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getTimeframeStats = () => {
    switch (timeframe) {
      case 'today':
        return {
          orders: stats.todayOrders,
          revenue: stats.todayRevenue,
          label: 'Today'
        };
      case 'week':
        return {
          orders: stats.thisWeekOrders,
          revenue: stats.thisWeekRevenue,
          label: 'This Week'
        };
      case 'month':
        return {
          orders: stats.thisMonthOrders,
          revenue: stats.thisMonthRevenue,
          label: 'This Month'
        };
      default:
        return {
          orders: stats.totalOrders,
          revenue: stats.totalRevenue,
          label: 'All Time'
        };
    }
  };

  const currentStats = getTimeframeStats();

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
          <CardDescription>
            {dateFrom && dateTo 
              ? `Custom period: ${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`
              : 'Order performance metrics'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' }
            ].map((period) => (
              <Button
                key={period.id}
                variant={timeframe === period.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(period.id as any)}
              >
                {period.label}
              </Button>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Orders</p>
                    <p className="text-2xl font-bold">{currentStats.orders}</p>
                    <p className="text-xs text-muted-foreground">{currentStats.label}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(currentStats.revenue)}</p>
                    <p className="text-xs text-muted-foreground">{currentStats.label}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold">
                      {currentStats.orders > 0 
                        ? formatCurrency(currentStats.revenue / currentStats.orders)
                        : formatCurrency(0)
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">{currentStats.label}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-2xl font-bold">
                      {stats.totalOrders > 0 
                        ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
                        : 0
                      }%
                    </p>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.statusBreakdown || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{count as number}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalOrders > 0 
                        ? Math.round(((count as number) / stats.totalOrders) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Order Type Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.orderTypeBreakdown || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={type === 'subscription' ? 'default' : 'secondary'} className="capitalize">
                      {type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{count as number}</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.totalOrders > 0 
                        ? Math.round(((count as number) / stats.totalOrders) * 100)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.subscriptionOrders}
              </div>
              <p className="text-sm text-muted-foreground">Subscription Orders</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalOrders > 0 
                  ? Math.round((stats.subscriptionOrders / stats.totalOrders) * 100)
                  : 0
                }% of total
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.completedOrders}
              </div>
              <p className="text-sm text-muted-foreground">Completed Orders</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalOrders > 0 
                  ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
                  : 0
                }% completion rate
              </p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {stats.pendingOrders}
              </div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalOrders > 0 
                  ? Math.round((stats.pendingOrders / stats.totalOrders) * 100)
                  : 0
                }% pending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 