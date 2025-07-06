"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  Package, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ShoppingCart,
  FileText,
  Download,
  Eye,
  Clock,
  Truck,
  CreditCard
} from 'lucide-react';
import Image from 'next/image';
import SubscriptionDetails from './SubscriptionDetails';
import InvoiceDownloadButton from './InvoiceDownloadButton';

interface OrderDetailsModalProps {
  order: any;
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, user, isOpen, onClose }: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'delivery' | 'subscription'>('overview');

  if (!isOpen || !order) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'payment_success':
      case 'Payment Success':
      case 'delivered':
      case 'Delivered':
        return 'default';
      case 'shipped':
      case 'Shipped':
        return 'secondary';
      case 'processing':
      case 'Processing':
        return 'outline';
      case 'payment_pending':
      case 'Payment Pending':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_success':
      case 'Payment Success':
      case 'delivered':
      case 'Delivered':
        return 'text-green-600 bg-green-50';
      case 'shipped':
      case 'Shipped':
        return 'text-blue-600 bg-blue-50';
      case 'processing':
      case 'Processing':
        return 'text-yellow-600 bg-yellow-50';
      case 'payment_pending':
      case 'Payment Pending':
        return 'text-gray-600 bg-gray-50';
      case 'payment_failed':
      case 'Payment Failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-orange-600 bg-orange-50';
    }
  };

  const orderItems = Array.isArray(order.items) ? order.items : [];
  const totalItems = orderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order #{order.id.slice(-8)}
            </CardTitle>
            <CardDescription>
              Placed on {formatDate(order.created_at)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status === 'payment_success' ? 'Payment Success' : 
               order.status === 'payment_pending' ? 'Payment Pending' :
               order.status === 'payment_failed' ? 'Payment Failed' :
               order.status}
            </Badge>
            <Badge variant="outline">
              {order.order_type === 'subscription' ? 'Subscription' : 'Regular Order'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 border-b">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'items', label: 'Items', icon: ShoppingCart },
              { id: 'delivery', label: 'Delivery', icon: Truck },
              ...(order.order_type === 'subscription' ? [{ id: 'subscription', label: 'Subscription', icon: Clock }] : [])
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium font-mono">{order.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date:</span>
                      <span className="font-medium">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Type:</span>
                      <span className="font-medium capitalize">{order.order_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Items:</span>
                      <span className="font-medium">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span className="text-primary">{formatCurrency(order.total_amount || 0)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InvoiceDownloadButton
                      orderId={order.id}
                      userId={user?.id}
                      className="w-full"
                    />
                    <Button variant="outline" className="w-full">
                      <Truck className="mr-2 h-4 w-4" />
                      Track Delivery
                    </Button>
                    <Button variant="outline" className="w-full">
                      <CreditCard className="mr-2 h-4 w-4" />
                      View Payment Details
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)}`}></div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {order.status === 'payment_success' ? 'Payment Successful' : 
                           order.status === 'payment_pending' ? 'Payment Pending' :
                           order.status === 'payment_failed' ? 'Payment Failed' :
                           order.status}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <div className="space-y-3">
                {orderItems.length > 0 ? (
                  orderItems.map((item: any, index: number) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.juiceName || item.name || 'Item'}
                              width={60}
                              height={60}
                              className="rounded object-cover border"
                              unoptimized={item.image.startsWith('https://placehold.co')}
                              onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/60x60.png';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{item.juiceName || item.name || 'Unknown Item'}</h4>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} • Price: {formatCurrency(item.pricePerItem || item.price || 0)} each
                            </p>
                            <p className="text-sm font-medium">
                              Subtotal: {formatCurrency((item.quantity || 0) * (item.pricePerItem || item.price || 0))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No items found in this order</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Delivery Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{order.email || order.shipping_address?.email || 'Not provided'}</p>
                      </div>
                    </div>
                    {(order.shipping_address?.phone || order.shipping_address?.mobileNumber) && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{order.shipping_address.phone || order.shipping_address.mobileNumber}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {order.shipping_address?.firstName || order.shipping_address?.name} {order.shipping_address?.lastName || ''}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">
                          {order.shipping_address?.firstName || order.shipping_address?.name} {order.shipping_address?.lastName || ''}
                        </p>
                        {order.shipping_address?.address && (
                          <p>{order.shipping_address.address}</p>
                        )}
                        {order.shipping_address?.addressLine1 && (
                          <p>{order.shipping_address.addressLine1}</p>
                        )}
                        {order.shipping_address?.addressLine2 && (
                          <p>{order.shipping_address.addressLine2}</p>
                        )}
                        <p>
                          {order.shipping_address?.city || order.shipping_address?.address?.city}
                          {order.shipping_address?.state && `, ${order.shipping_address.state}`}
                          {order.shipping_address?.zipCode && ` ${order.shipping_address.zipCode}`}
                        </p>
                        {order.shipping_address?.country && (
                          <p>{order.shipping_address.country}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && order.order_type === 'subscription' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Subscription Information</h3>
              
              {order.subscription_info ? (
                <SubscriptionDetails 
                  subscriptionInfo={order.subscription_info} 
                  orderType={order.order_type} 
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No subscription information available</p>
                    <p className="text-sm text-muted-foreground">This appears to be a regular order</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 