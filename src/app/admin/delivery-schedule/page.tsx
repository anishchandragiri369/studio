"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar,
  Clock,
  Settings,
  History,
  Save,
  RefreshCw,
  AlertCircle,
  Truck,
  Package,
  Utensils,
  Coffee
} from 'lucide-react';

interface DeliveryScheduleSetting {
  id: number;
  subscription_type: string;
  delivery_gap_days: number;
  is_daily: boolean;
  description: string;
  is_active: boolean;
  updated_at: string;
  updated_by: string; // Changed from updated_by_email to updated_by
}

interface AuditRecord {
  id: number; // Changed from string to number
  subscription_type: string;
  old_delivery_gap_days: number;
  new_delivery_gap_days: number;
  old_is_daily: boolean;
  new_is_daily: boolean;
  changed_by: string; // Changed from changed_by_email to changed_by
  change_reason: string;
  created_at: string;
}

interface EditForm {
  subscription_type: string;
  delivery_gap_days: number;
  is_daily: boolean;
  description: string;
  change_reason: string;
}

export default function DeliverySchedulePage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [scheduleSettings, setScheduleSettings] = useState<DeliveryScheduleSetting[]>([]);
  const [auditHistory, setAuditHistory] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    subscription_type: '',
    delivery_gap_days: 1,
    is_daily: false,
    description: '',
    change_reason: ''
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/login');
      return;
    }

    if (user && isAdmin) {
      fetchScheduleSettings();
      fetchAuditHistory();
    }
  }, [user, loading, isAdmin, router]);

  const fetchScheduleSettings = async () => {
    try {
      const response = await fetch('/api/admin/delivery-schedule');
      const data = await response.json();

      if (Array.isArray(data)) {
        setScheduleSettings(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch delivery schedule settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching schedule settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery schedule settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditHistory = async (subscriptionType?: string) => {
    try {
      const params = new URLSearchParams();
      if (subscriptionType) {
        params.append('subscription_type', subscriptionType);
      }
      params.append('limit', '20');

      const response = await fetch(`/api/admin/delivery-schedule/audit?${params}`);
      const data = await response.json();

      if (data.success) {
        setAuditHistory(data.audit_history);
      }
    } catch (error) {
      console.error('Error fetching audit history:', error);
    }
  };

  const handleEditSetting = (setting: DeliveryScheduleSetting) => {
    setEditForm({
      subscription_type: setting.subscription_type,
      delivery_gap_days: setting.delivery_gap_days,
      is_daily: setting.is_daily,
      description: setting.description,
      change_reason: ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateSetting = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/delivery-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          admin_email: user?.email
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Delivery schedule updated for ${editForm.subscription_type}`,
          variant: "default",
        });

        setEditDialogOpen(false);
        fetchScheduleSettings();
        fetchAuditHistory();
        
        setEditForm({
          subscription_type: '',
          delivery_gap_days: 1,
          is_daily: false,
          description: '',
          change_reason: ''
        });
      } else {
        toast({
          title: "Error",
          description: data.error ?? "Failed to update delivery schedule",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery schedule",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getSubscriptionIcon = (type: string) => {
    switch (type) {
      case 'juices':
        return <Coffee className="h-5 w-5" />;
      case 'fruit_bowls':
        return <Utensils className="h-5 w-5" />;
      case 'customized':
        return <Package className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
    }
  };

  const getSubscriptionLabel = (type: string) => {
    switch (type) {
      case 'juices':
        return 'Juice Subscriptions';
      case 'fruit_bowls':
        return 'Fruit Bowl Subscriptions';
      case 'customized':
        return 'Customized Subscriptions';
      default:
        return type;
    }
  };

  const formatScheduleDescription = (setting: DeliveryScheduleSetting) => {
    if (setting.is_daily) {
      return "Daily delivery (every day)";
    } else {
      return `Every ${setting.delivery_gap_days} day${setting.delivery_gap_days > 1 ? 's' : ''}`;
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2">Loading delivery schedule settings...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-green-600" />
            Delivery Schedule Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Configure delivery frequency and gaps for different subscription types
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Current Settings
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Change History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {scheduleSettings.map((setting) => (
                <Card key={setting.subscription_type} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {getSubscriptionIcon(setting.subscription_type)}
                        {getSubscriptionLabel(setting.subscription_type)}
                      </CardTitle>
                      <Badge variant={setting.is_active ? "default" : "secondary"}>
                        {setting.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {formatScheduleDescription(setting)}
                        </span>
                      </div>
                      
                      {setting.description && (
                        <p className="text-sm text-gray-600">
                          {setting.description}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(setting.updated_at).toLocaleDateString()} by {setting.updated_by ?? 'System'}
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleEditSetting(setting)}
                      className="w-full"
                      variant="outline"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Schedule
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Changes to delivery schedules will affect all future deliveries for the respective subscription types. 
                Existing scheduled deliveries will not be modified automatically.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Changes
                </CardTitle>
                <CardDescription>
                  Track all modifications made to delivery schedule settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No changes recorded yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditHistory.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getSubscriptionIcon(record.subscription_type)}
                            <span className="font-medium">
                              {getSubscriptionLabel(record.subscription_type)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(record.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Delivery Gap:</strong> {record.old_delivery_gap_days} days → {record.new_delivery_gap_days} days
                          </div>
                          <div>
                            <strong>Daily Schedule:</strong> {record.old_is_daily ? 'Yes' : 'No'} → {record.new_is_daily ? 'Yes' : 'No'}
                          </div>
                          <div>
                            <strong>Changed by:</strong> {record.changed_by ?? 'Unknown'}
                          </div>
                          {record.change_reason && (
                            <div>
                              <strong>Reason:</strong> {record.change_reason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Schedule Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit Delivery Schedule
              </DialogTitle>
              <DialogDescription>
                Update the delivery schedule for {getSubscriptionLabel(editForm.subscription_type)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="is_daily">Daily Delivery</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_daily"
                    checked={editForm.is_daily}
                    onCheckedChange={(checked) => 
                      setEditForm({ ...editForm, is_daily: checked })
                    }
                  />
                  <Label htmlFor="is_daily" className="text-sm">
                    Enable daily delivery (every day)
                  </Label>
                </div>
              </div>

              {!editForm.is_daily && (
                <div className="space-y-2">
                  <Label htmlFor="delivery_gap_days">Delivery Gap (Days)</Label>
                  <Input
                    id="delivery_gap_days"
                    type="number"
                    min="1"
                    max="30"
                    value={editForm.delivery_gap_days}
                    onChange={(e) => 
                      setEditForm({ ...editForm, delivery_gap_days: parseInt(e.target.value) || 1 })
                    }
                  />
                  <p className="text-sm text-gray-500">
                    Number of days between deliveries (1-30 days)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editForm.description}
                  onChange={(e) => 
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Optional description for this schedule..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="change_reason">Reason for Change</Label>
                <Textarea
                  id="change_reason"
                  value={editForm.change_reason}
                  onChange={(e) => 
                    setEditForm({ ...editForm, change_reason: e.target.value })
                  }
                  placeholder="Why are you making this change?"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateSetting}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Schedule
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
