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
  Clock
} from 'lucide-react';
import Image from 'next/image';

interface OrderDetailsModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'customer' | 'subscription'>('details');

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

  const downloadInvoice = () => {
    // This would integrate with your invoice generation system
    console.log('Downloading invoice for order:', order.id);
  };

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
              {formatDate(order.created_at)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {order.status === 'payment_success' ? 'Payment Success' : 
               order.status === 'payment_pending' ? 'Payment Pending' :
               order.status}
            </Badge>
            <Badge variant="outline">
              {order.order_type === 'subscription' ? 'Subscription' : 'Regular'}
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
              { id: 'details', label: 'Order Details', icon: FileText },
              { id: 'items', label: 'Items', icon: ShoppingCart },
              { id: 'customer', label: 'Customer', icon: User },
              { id: 'subscription', label: 'Subscription', icon: Clock }
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
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium">{order.id}</span>
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
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status === 'payment_success' ? 'Payment Success' : 
                         order.status === 'payment_pending' ? 'Payment Pending' :
                         order.status}
                      </Badge>
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
                    <Button className="w-full" onClick={downloadInvoice}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Invoice
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      View Customer Profile
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Package className="mr-2 h-4 w-4" />
                      Track Delivery
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <div className="space-y-3">
                {order.items?.map((item: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.juiceName || item.name || 'Item'}
                            width={60}
                            height={60}
                            className="rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.juiceName || item.name || 'Unknown Item'}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} • Price: {formatCurrency(item.pricePerItem || 0)} each
                          </p>
                          <p className="text-sm font-medium">
                            Subtotal: {formatCurrency((item.quantity || 0) * (item.pricePerItem || 0))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Customer Information</h3>
              
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
                    {order.shipping_address?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{order.shipping_address.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">
                          {order.shipping_address?.firstName} {order.shipping_address?.lastName}
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
                        <p className="font-medium">{order.shipping_address?.addressLine1}</p>
                        {order.shipping_address?.addressLine2 && (
                          <p>{order.shipping_address.addressLine2}</p>
                        )}
                        <p>
                          {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zipCode}
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

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Subscription Information</h3>
              
              {order.subscription_info ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Plan Name</p>
                          <p className="font-medium">{order.subscription_info.planName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Frequency</p>
                          <p className="font-medium capitalize">{order.subscription_info.planFrequency || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-medium">{order.subscription_info.subscriptionDuration || 'N/A'} cycles</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Base Price</p>
                          <p className="font-medium">{formatCurrency(order.subscription_info.basePrice || 0)}</p>
                        </div>
                      </div>
                      
                      {order.subscription_info.selectedJuices && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Selected Juices</p>
                          <div className="space-y-2">
                            {order.subscription_info.selectedJuices.map((juice: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>Juice ID: {juice.juiceId}</span>
                                <span>Qty: {juice.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {order.subscription_info.selectedFruitBowls && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Selected Fruit Bowls</p>
                          <div className="space-y-2">
                            {order.subscription_info.selectedFruitBowls.map((bowl: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>Bowl ID: {bowl.fruitBowlId}</span>
                                <span>Qty: {bowl.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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