"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  BarChart, 
  PackagePlus, 
  Settings,
  TrendingUp,
  Users,
  Package,
  Ticket
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user, loading, isSupabaseConfigured, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/admin');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router, isSupabaseConfigured]);

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

  const adminFeatures = [    {
      title: "Subscription Management",
      description: "Admin pause/reactivate controls for all or selected user subscriptions (holidays, emergencies)",
      icon: Users,
      href: "/admin/subscriptions",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Analytics Dashboard",
      description: "View comprehensive analytics for coupons, referrals, and rewards system performance",
      icon: BarChart,
      href: "/admin/analytics",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Coupon Management",
      description: "View and manage all coupon codes, including admin-only coupons for customer support",
      icon: Ticket,
      href: "/admin/coupons",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Add Product",
      description: "Add new juice products to the menu with images and details",
      icon: PackagePlus,
      href: "/admin/add-product",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Manage Stock",
      description: "Update inventory levels and manage product availability",
      icon: Package,
      href: "/admin/manage-stock",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Reports",
      description: "Generate and view detailed reports on sales and performance",
      icon: TrendingUp,
      href: "/admin/reports",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </CardTitle>
            <CardDescription className="text-lg">
              Welcome, {user.user_metadata?.full_name || user.email}. Manage your Elixr juice business from here.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card key={feature.href} className="group hover:shadow-lg transition-all duration-200 hover:scale-105">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <IconComponent className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={feature.href}>
                      Access {feature.title}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Quick Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BarChart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analytics</p>
                <p className="text-lg font-semibold">Track Performance</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Inventory</p>
                <p className="text-lg font-semibold">Manage Stock</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className="text-lg font-semibold">View Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
