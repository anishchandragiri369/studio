"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  Package, 
  Search, 
  Filter, 
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  Eye,
  Download,
  RefreshCw,
  ArrowLeft,
  BarChart3,
  FileText,
  ShoppingCart,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import SubscriptionDetails from '@/components/orders/SubscriptionDetails';
import SubscriptionAnalytics from '@/components/admin/SubscriptionAnalytics';

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  order_type: string;
  items: any[];
  shipping_address: any;
  user_id: string;
  email: string;
  customer_info?: any;
  subscription_info?: any;
  rating_submitted?: boolean;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  subscriptionOrders: number;
  regularOrders: number;
  pendingOrders: number;
  completedOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

export default function AdminOrdersPage() {
  const { user, loading, isSupabaseConfigured, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/admin/orders');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router, isSupabaseConfigured]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Admin Orders Management - Elixr';
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin && isSupabaseConfigured) {
      fetchAllOrders();
    }
  }, [user, isAdmin, isSupabaseConfigured]);

  // Apply filters whenever filters change
  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, orderTypeFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const fetchAllOrders = async () => {
    setLoadingOrders(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
      } else {
        setOrders(data || []);
        calculateStats(data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const calculateStats = (ordersData: Order[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const stats: OrderStats = {
      totalOrders: ordersData.length,
      totalRevenue: ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      averageOrderValue: ordersData.length > 0 ? ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0) / ordersData.length : 0,
      subscriptionOrders: ordersData.filter(order => order.order_type === 'subscription').length,
      regularOrders: ordersData.filter(order => order.order_type !== 'subscription').length,
      pendingOrders: ordersData.filter(order => 
        ['payment_pending', 'Payment Pending', 'processing', 'Processing'].includes(order.status)
      ).length,
      completedOrders: ordersData.filter(order => 
        ['payment_success', 'Payment Success', 'delivered', 'Delivered', 'shipped', 'Shipped'].includes(order.status)
      ).length,
      todayOrders: ordersData.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      }).length,
      todayRevenue: ordersData.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today;
      }).reduce((sum, order) => sum + (order.total_amount || 0), 0)
    };

    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Order type filter
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.order_type === orderTypeFilter);
    }

    // Date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(order => new Date(order.created_at) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(order => new Date(order.created_at) <= toDate);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Order];
      let bValue: any = b[sortBy as keyof Order];

      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
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

  const exportOrders = () => {
    const csvContent = [
      ['Order ID', 'Date', 'Customer Email', 'Status', 'Type', 'Total Amount', 'Items Count'],
      ...filteredOrders.map(order => [
        order.id,
        formatDate(order.created_at),
        order.email || order.shipping_address?.email || 'N/A',
        order.status,
        order.order_type,
        order.total_amount?.toString() || '0',
        order.items?.length?.toString() || '0'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredOrders.length} orders to CSV`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Configuration Required</AlertTitle>
          <AlertDescription>
            Admin features are currently unavailable due to system configuration issues.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button variant="outline" asChild className="mb-4">
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <Package className="h-8 w-8 text-primary" />
                  Orders Management
                </CardTitle>
                <CardDescription className="text-lg">
                  View and manage all customer orders across the platform
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <Package className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Today's Orders</p>
                    <p className="text-2xl font-bold">{stats.todayOrders}</p>
                    <p className="text-sm text-green-600">{formatCurrency(stats.todayRevenue)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Subscription Analytics */}
        {orders.length > 0 && (
          <div className="mb-8">
            <SubscriptionAnalytics orders={orders} />
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Order ID, Email, Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="payment_success">Payment Success</SelectItem>
                    <SelectItem value="payment_pending">Payment Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="orderType">Order Type</Label>
                <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Date</SelectItem>
                    <SelectItem value="total_amount">Amount</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'} Sort
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setOrderTypeFilter('all');
                    setDateFrom('');
                    setDateTo('');
                    setSortBy('created_at');
                    setSortOrder('desc');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAllOrders} disabled={loadingOrders}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportOrders} disabled={filteredOrders.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loadingOrders ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p>Loading orders...</p>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-lg">Order #{order.id.slice(-8)}</h3>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status === 'payment_success' ? 'Payment Success' : 
                           order.status === 'payment_pending' ? 'Payment Pending' :
                           order.status}
                        </Badge>
                        <Badge variant="outline">
                          {order.order_type === 'subscription' ? 'Subscription' : 'Regular'}
                        </Badge>
                        {order.order_type === 'subscription' && order.subscription_info && (
                          <Badge variant={
                            order.subscription_info.selectedCategory && order.subscription_info.selectedCategory !== 'custom' 
                              ? 'default' 
                              : order.subscription_info.selectedJuices?.length > 0 
                                ? 'secondary' 
                                : 'outline'
                          }>
                            {order.subscription_info.selectedCategory && order.subscription_info.selectedCategory !== 'custom' 
                              ? `Category: ${order.subscription_info.selectedCategory}` 
                              : order.subscription_info.selectedJuices?.length > 0 
                                ? 'Customized' 
                                : 'Standard'
                            }
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(order.total_amount || 0)}
                        </div>
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          {order.items?.length || 0} items
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {order.email || order.shipping_address?.email || 'No email'}
                        </div>
                        {order.shipping_address?.firstName && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {order.shipping_address.firstName} {order.shipping_address.lastName}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {selectedOrder?.id === order.id ? 'Hide' : 'View'} Details
                      </Button>
                    </div>
                  </div>
                  
                  {/* Order Details */}
                  {selectedOrder?.id === order.id && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold mb-4">Order Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Items */}
                        <div>
                          <h5 className="font-medium mb-2">Items</h5>
                          <div className="space-y-2">
                            {order.items?.map((item, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                                {item.image && (
                                  <Image
                                    src={item.image}
                                    alt={item.juiceName || item.name || 'Item'}
                                    width={40}
                                    height={40}
                                    className="rounded object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium">{item.juiceName || item.name || 'Unknown Item'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Qty: {item.quantity} • {formatCurrency(item.pricePerItem || 0)} each
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Customer Info */}
                        <div>
                          <h5 className="font-medium mb-2">Customer Information</h5>
                          <div className="space-y-2 text-sm">
                            {order.shipping_address?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {order.shipping_address.email}
                              </div>
                            )}
                            {order.shipping_address?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {order.shipping_address.phone}
                              </div>
                            )}
                            {order.shipping_address?.addressLine1 && (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                <div>
                                  <p>{order.shipping_address.addressLine1}</p>
                                  {order.shipping_address.addressLine2 && (
                                    <p>{order.shipping_address.addressLine2}</p>
                                  )}
                                  <p>
                                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Subscription Info */}
                      {order.subscription_info && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="font-medium mb-2">Subscription Information</h5>
                          <SubscriptionDetails 
                            subscriptionInfo={order.subscription_info} 
                            orderType={order.order_type} 
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 