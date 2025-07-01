"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Package, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DeliveryScheduleProps {
  subscriptionId: string;
}

interface DeliveryRecord {
  id: string;
  delivery_date: string;
  status: 'scheduled' | 'delivered' | 'skipped' | 'failed';
  items: any[];
}

export default function DeliverySchedule({ subscriptionId }: DeliveryScheduleProps) {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const fetchDeliverySchedule = async () => {
    if (!user || !subscriptionId) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/subscriptions/delivery-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          userId: user.id,
          action: 'get_schedule'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDeliveries(result.data.deliveries || []);
      } else {
        console.error('Error fetching delivery schedule:', result.message);
      }
    } catch (error) {
      console.error('Error fetching delivery schedule:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshSchedule = async () => {
    setRefreshing(true);
    await fetchDeliverySchedule();
  };

  useEffect(() => {
    fetchDeliverySchedule();
  }, [subscriptionId, user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'skipped': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeUntilDelivery = (dateString: string) => {
    const deliveryDate = new Date(dateString);
    const now = new Date();
    const diffMs = deliveryDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Due now';
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours > 0 ? `${hours}h` : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return 'Less than 1 hour';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Delivery Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Deliveries
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshSchedule}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {deliveries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming deliveries scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery, index) => (
              <div 
                key={delivery.id} 
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  index === 0 ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg">
                        {formatDate(delivery.delivery_date)}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(delivery.delivery_date)}
                      </span>
                    </div>
                    {index === 0 && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Next Delivery
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                    </Badge>
                    {delivery.status === 'scheduled' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        in {getTimeUntilDelivery(delivery.delivery_date)}
                      </p>
                    )}
                  </div>
                </div>
                
                {delivery.items && delivery.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">Items:</p>
                    <div className="flex flex-wrap gap-2">
                      {delivery.items.slice(0, 3).map((item: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {item.name || item.juice_name || `Item ${idx + 1}`}
                        </Badge>
                      ))}
                      {delivery.items.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{delivery.items.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {deliveries.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              📅 Deliveries are scheduled with proper spacing and exclude Sundays for your convenience.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
