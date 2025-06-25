"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Shield, 
  Ticket,
  Copy,
  Check,
  Eye,
  EyeOff,
  Search,
  Plus,
  Edit,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { COUPONS, type Coupon } from '@/lib/coupons';
import { useToast } from '@/hooks/use-toast';

export default function AdminCouponsPage() {
  const { user, loading, isSupabaseConfigured, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdminOnly, setShowAdminOnly] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);  const [coupons, setCoupons] = useState<Coupon[]>(COUPONS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    discount: 0,
    discountType: 'fixed',
    description: '',
    minOrderAmount: undefined,
    maxDiscountAmount: undefined,
    validFor: 'all',
    isActive: true,
    firstOrderOnly: false,
    maxUsesPerUser: undefined,
    adminOnly: false,
  });

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/admin/coupons');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router, isSupabaseConfigured]);
  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: "Copied!",
        description: `Coupon code "${code}" copied to clipboard`,
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy coupon code",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount: 0,
      discountType: 'fixed',
      description: '',
      minOrderAmount: undefined,
      maxDiscountAmount: undefined,
      validFor: 'all',
      isActive: true,
      firstOrderOnly: false,
      maxUsesPerUser: undefined,
      adminOnly: false,
    });
    setEditingCoupon(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setFormData(coupon);
    setEditingCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleSaveCoupon = () => {
    // Validation
    if (!formData.code?.trim()) {
      toast({
        title: "Error",
        description: "Coupon code is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description?.trim()) {
      toast({
        title: "Error",
        description: "Description is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.discount || formData.discount <= 0) {
      toast({
        title: "Error",
        description: "Discount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate codes (excluding current coupon when editing)
    const isDuplicate = coupons.some(coupon => 
      coupon.code.toLowerCase() === formData.code?.toLowerCase() && 
      (!editingCoupon || coupon.code !== editingCoupon.code)
    );

    if (isDuplicate) {
      toast({
        title: "Error",
        description: "A coupon with this code already exists",
        variant: "destructive",
      });
      return;
    }

    const newCoupon: Coupon = {
      code: formData.code!.toUpperCase().trim(),
      discount: formData.discount!,
      discountType: formData.discountType!,
      description: formData.description!.trim(),
      minOrderAmount: formData.minOrderAmount || undefined,
      maxDiscountAmount: formData.maxDiscountAmount || undefined,
      validFor: formData.validFor!,
      isActive: formData.isActive!,
      firstOrderOnly: formData.firstOrderOnly || false,
      maxUsesPerUser: formData.maxUsesPerUser || undefined,
      adminOnly: formData.adminOnly || false,
    };

    if (editingCoupon) {
      // Update existing coupon
      setCoupons(prev => prev.map(coupon => 
        coupon.code === editingCoupon.code ? newCoupon : coupon
      ));
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      });
    } else {
      // Add new coupon
      setCoupons(prev => [...prev, newCoupon]);
      toast({
        title: "Success",
        description: "Coupon created successfully",
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };
  const handleDeleteCoupon = (couponCode: string) => {
    setCouponToDelete(couponCode);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCoupon = () => {
    if (couponToDelete) {
      setCoupons(prev => prev.filter(coupon => coupon.code !== couponToDelete));
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  const toggleCouponStatus = (couponCode: string) => {
    setCoupons(prev => prev.map(coupon => 
      coupon.code === couponCode 
        ? { ...coupon, isActive: !coupon.isActive }
        : coupon
    ));
    const coupon = coupons.find(c => c.code === couponCode);
    toast({
      title: "Success",
      description: `Coupon ${coupon?.isActive ? 'deactivated' : 'activated'} successfully`,
    });
  };
  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showAdminOnly) {
      return matchesSearch && coupon.adminOnly;
    }
    
    return matchesSearch;
  });

  const adminOnlyCoupons = coupons.filter(coupon => coupon.adminOnly);
  const publicCoupons = coupons.filter(coupon => !coupon.adminOnly);

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
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Coupon Management
            </CardTitle>
            <CardDescription>
              View and manage all coupon codes. Share admin-only codes with customers as needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search coupon codes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>              <div className="flex gap-2">
                <Button
                  variant={showAdminOnly ? "default" : "outline"}
                  onClick={() => setShowAdminOnly(!showAdminOnly)}
                  className="flex items-center gap-2"
                >
                  {showAdminOnly ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {showAdminOnly ? "Show All" : "Admin Only"}
                </Button>
                <Button
                  onClick={openAddDialog}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Coupon
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{COUPONS.length}</div>
                  <div className="text-sm text-muted-foreground">Total Coupons</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{publicCoupons.length}</div>
                  <div className="text-sm text-muted-foreground">Public Coupons</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{adminOnlyCoupons.length}</div>
                  <div className="text-sm text-muted-foreground">Admin Only</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Coupon List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => (
            <Card key={coupon.code} className={`group hover:shadow-lg transition-all duration-200 ${
              coupon.adminOnly ? 'border-red-200 bg-red-50/50' : 'border-green-200 bg-green-50/50'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-mono font-bold text-primary">
                    {coupon.code}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {coupon.adminOnly && (
                      <Badge variant="destructive" className="text-xs">
                        ADMIN ONLY
                      </Badge>
                    )}
                    {!coupon.isActive && (
                      <Badge variant="secondary" className="text-xs">
                        INACTIVE
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {coupon.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium">
                      {coupon.discountType === 'fixed' 
                        ? `₹${coupon.discount}`
                        : `${coupon.discount}%`
                      }
                    </span>
                  </div>
                  
                  {coupon.minOrderAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Order:</span>
                      <span className="font-medium">₹{coupon.minOrderAmount}</span>
                    </div>
                  )}
                  
                  {coupon.maxDiscountAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Discount:</span>
                      <span className="font-medium">₹{coupon.maxDiscountAmount}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid For:</span>
                    <span className="font-medium capitalize">{coupon.validFor}</span>
                  </div>
                  
                  {coupon.firstOrderOnly && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">First Order:</span>
                      <span className="font-medium text-orange-600">Only</span>
                    </div>
                  )}
                  
                  {coupon.maxUsesPerUser && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uses Per User:</span>
                      <span className="font-medium">{coupon.maxUsesPerUser}</span>
                    </div>
                  )}                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => copyToClipboard(coupon.code)}
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-2"
                  >
                    {copiedCode === coupon.code ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedCode === coupon.code ? 'Copied!' : 'Copy Code'}
                  </Button>
                  <Button
                    onClick={() => openEditDialog(coupon)}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => toggleCouponStatus(coupon.code)}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    {coupon.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    onClick={() => handleDeleteCoupon(coupon.code)}
                    variant="outline"
                    size="sm"
                    className="px-3 hover:bg-red-50 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCoupons.length === 0 && (
          <Card className="text-center py-8">
            <CardContent>
              <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">No coupons found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'No coupons match the current filter.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Admin Instructions */}
        <Card className="mt-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Admin Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Public Coupons:</strong> These are visible to all users in the coupon dropdown during checkout.</p>
            <p><strong>Admin-Only Coupons:</strong> These are hidden from regular users but can be manually entered if you share the code with them.</p>
            <p><strong>Usage:</strong> Copy any coupon code and share it with customers via email, chat, or phone support.</p>
            <p><strong>Validation:</strong> All coupons still respect their conditions (min order, first order only, usage limits, etc.).</p>
          </CardContent>        </Card>

        {/* Add/Edit Coupon Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </DialogTitle>
              <DialogDescription>
                {editingCoupon 
                  ? 'Modify the coupon settings below.'
                  : 'Create a new coupon code for customers to use at checkout.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Coupon Code */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Enter coupon code"
                  className="col-span-3"
                />
              </div>

              {/* Description */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this coupon is for"
                  className="col-span-3"
                  rows={2}
                />
              </div>

              {/* Discount Amount */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discount" className="text-right">
                  Discount *
                </Label>
                <Input
                  id="discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                  placeholder="Enter discount amount"
                  className="col-span-1"
                  min="0"
                  step="0.01"
                />
                <Select
                  value={formData.discountType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, discountType: value as 'fixed' | 'percentage' }))}
                >
                  <SelectTrigger className="col-span-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Order Amount */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minOrderAmount" className="text-right">
                  Min Order
                </Label>
                <Input
                  id="minOrderAmount"
                  type="number"
                  value={formData.minOrderAmount || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    minOrderAmount: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  placeholder="Optional minimum order amount"
                  className="col-span-3"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Max Discount Amount */}
              {formData.discountType === 'percentage' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="maxDiscountAmount" className="text-right">
                    Max Discount
                  </Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    placeholder="Optional maximum discount cap"
                    className="col-span-3"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}              {/* Valid For */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="validFor" className="text-right">
                  Valid For
                </Label>
                <Select
                  value={formData.validFor}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, validFor: value as 'all' | 'monthly' | 'weekly' }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="monthly">Monthly Subscriptions</SelectItem>
                    <SelectItem value="weekly">Weekly Subscriptions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Uses Per User */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxUsesPerUser" className="text-right">
                  Uses Per User
                </Label>
                <Input
                  id="maxUsesPerUser"
                  type="number"
                  value={formData.maxUsesPerUser || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxUsesPerUser: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  placeholder="Optional usage limit per user"
                  className="col-span-3"
                  min="1"
                />
              </div>

              {/* Switches */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">First Order Only</Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    checked={formData.firstOrderOnly}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, firstOrderOnly: checked }))}
                  />
                  <Label className="text-sm text-muted-foreground">
                    Only valid for customer's first order
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Admin Only</Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    checked={formData.adminOnly}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adminOnly: checked }))}
                  />
                  <Label className="text-sm text-muted-foreground">
                    Hide from regular users (admin sharing only)
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Active</Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label className="text-sm text-muted-foreground">
                    Coupon can be used by customers
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveCoupon}>
                <Save className="h-4 w-4 mr-2" />
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </Button>            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Coupon</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the coupon "{couponToDelete}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setCouponToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteCoupon}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Coupon
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
