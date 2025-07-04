"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Shield, 
  Pause,
  Play,
  Users,
  Calendar,
  Clock,
  AlertCircle,
  History,
  RefreshCw
} from 'lucide-react';

interface SubscriptionStats {
  total: number;
  active: number;
  adminPaused: number;
  userPaused: number;
  expired: number;
}

interface AdminPause {
  id: string;
  pause_type: 'all' | 'selected';
  affected_user_ids: string[] | null;
  start_date: string;
  end_date: string | null;
  reason: string;
  admin_user_id: string;
  status: 'active' | 'reactivated' | 'cancelled';
  affected_subscription_count: number;
  reactivated_at: string | null;
  reactivated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  details: any;
  created_at: string;
}

export default function AdminSubscriptionManagementPage() {
  const { user, loading, isSupabaseConfigured, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [adminPauses, setAdminPauses] = useState<AdminPause[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // User selection state
  const [usersWithSubscriptions, setUsersWithSubscriptions] = useState<{user_id: string, email: string}[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Pause dialog state
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pauseType, setPauseType] = useState<'all' | 'selected'>('all');
  const [pauseStartDate, setPauseStartDate] = useState('');
  const [pauseEndDate, setPauseEndDate] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [pauseSubmitting, setPauseSubmitting] = useState(false);

  // Reactivate dialog state
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [reactivateType, setReactivateType] = useState<'all_paused' | 'selected'>('all_paused');
  const [selectedSubscriptionIds, setSelectedSubscriptionIds] = useState('');
  const [selectedAdminPauseId, setSelectedAdminPauseId] = useState('');
  const [reactivateSubmitting, setReactivateSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      router.push('/login?redirect=/admin/subscriptions');
    } else if (!loading && user && !isAdmin) {
      router.push('/');
    }
  }, [user, loading, isAdmin, router, isSupabaseConfigured]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/admin/subscriptions/overview?adminUserId=${user?.id}&includeSubscriptions=false`);
      const result = await response.json();

      if (result.success) {
        setSubscriptionStats(result.data.subscriptionStats);
        setAdminPauses(result.data.adminPauses);
        setAuditLogs(result.data.auditLogs);
      } else {
        toast({
          title: "Error",
          description: result.message ?? "Failed to fetch subscription data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching data",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const fetchUsersWithSubscriptions = async () => {
    if (usersWithSubscriptions.length > 0) return; // Already loaded
    
    try {
      setLoadingUsers(true);
      const response = await fetch(`/api/admin/subscriptions/overview?adminUserId=${user?.id}&includeUsers=true`);
      const result = await response.json();

      if (result.success && result.data.usersWithSubscriptions) {
        setUsersWithSubscriptions(result.data.usersWithSubscriptions);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users with subscriptions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching users",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handlePauseSubmit = async () => {
    if (!pauseStartDate || !pauseReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Start date and reason are required",
        variant: "destructive",
      });
      return;
    }

    if (pauseType === 'selected' && selectedUsers.size === 0) {
      toast({
        title: "Validation Error", 
        description: "Please select at least one user for selected pause type",
        variant: "destructive",
      });
      return;
    }

    setPauseSubmitting(true);
    try {
      const userIds = pauseType === 'selected' 
        ? Array.from(selectedUsers)
        : [];

      const response = await fetch('/api/admin/subscriptions/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pauseType,
          userIds,
          startDate: pauseStartDate,
          endDate: pauseEndDate || null,
          reason: pauseReason.trim(),
          adminUserId: user?.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully paused ${result.data.processedCount} subscriptions`,
          variant: "default",
        });
        setShowPauseDialog(false);
        resetPauseForm();
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: result.message ?? "Failed to pause subscriptions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error pausing subscriptions:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setPauseSubmitting(false);
    }
  };

  const handleReactivateSubmit = async () => {
    if (reactivateType === 'selected' && !selectedSubscriptionIds.trim() && !selectedAdminPauseId) {
      toast({
        title: "Validation Error",
        description: "Either subscription IDs or admin pause ID is required for selected reactivation",
        variant: "destructive",
      });
      return;
    }

    setReactivateSubmitting(true);
    try {
      const subscriptionIds = reactivateType === 'selected' && selectedSubscriptionIds.trim()
        ? selectedSubscriptionIds.split(',').map(id => id.trim()).filter(id => id)
        : [];

      const response = await fetch('/api/admin/subscriptions/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reactivateType,
          subscriptionIds,
          adminPauseId: selectedAdminPauseId || null,
          adminUserId: user?.id
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully reactivated ${result.data.processedCount} subscriptions`,
          variant: "default",
        });
        setShowReactivateDialog(false);
        resetReactivateForm();
        await fetchData();
      } else {
        toast({
          title: "Error",
          description: result.message ?? "Failed to reactivate subscriptions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error reactivating subscriptions:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setReactivateSubmitting(false);
    }
  };

  const resetPauseForm = () => {
    setPauseType('all');
    setSelectedUsers(new Set());
    setPauseStartDate('');
    setPauseEndDate('');
    setPauseReason('');
  };

  const handleUserSelection = (userId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (isSelected) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.size === usersWithSubscriptions.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(usersWithSubscriptions.map(u => u.user_id)));
    }
  };

  const resetReactivateForm = () => {
    setReactivateType('all_paused');
    setSelectedSubscriptionIds('');
    setSelectedAdminPauseId('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'active': 'destructive',
      'reactivated': 'default',
      'cancelled': 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading || loadingData) {
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
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <Users className="h-8 w-8 text-primary" />
                  Subscription Management
                </CardTitle>
                <CardDescription className="text-lg">
                  Admin controls for managing subscription pauses and reactivations
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        {subscriptionStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
                <div className="text-2xl font-bold">{subscriptionStats.total}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                <div className="text-2xl font-bold text-green-600">{subscriptionStats.active}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Admin Paused</CardTitle>
                <div className="text-2xl font-bold text-red-600">{subscriptionStats.adminPaused}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">User Paused</CardTitle>
                <div className="text-2xl font-bold text-orange-600">{subscriptionStats.userPaused}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
                <div className="text-2xl font-bold text-gray-600">{subscriptionStats.expired}</div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Pause className="h-4 w-4 mr-2" />
                Pause Subscriptions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Pause Subscriptions</DialogTitle>
                <DialogDescription>
                  Pause subscriptions for holidays, emergencies, or maintenance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pause-type">Pause Type</Label>
                  <Select value={pauseType} onValueChange={(value: 'all' | 'selected') => {
                    setPauseType(value);
                    if (value === 'selected') {
                      fetchUsersWithSubscriptions();
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Active Subscriptions</SelectItem>
                      <SelectItem value="selected">Selected Users Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {pauseType === 'selected' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Select Users with Active Subscriptions</Label>
                      {loadingUsers ? (
                        <div className="text-sm text-muted-foreground">Loading users...</div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllUsers}
                          disabled={usersWithSubscriptions.length === 0}
                        >
                          {selectedUsers.size === usersWithSubscriptions.length ? 'Deselect All' : 'Select All'}
                        </Button>
                      )}
                    </div>
                    
                    {loadingUsers && (
                      <div className="text-center py-4 text-muted-foreground">
                        Loading users with active subscriptions...
                      </div>
                    )}
                    
                    {!loadingUsers && usersWithSubscriptions.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No users with active subscriptions found
                      </div>
                    )}
                    
                    {!loadingUsers && usersWithSubscriptions.length > 0 && (
                      <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                        {usersWithSubscriptions.map((user) => (
                          <div key={user.user_id} className="flex items-center space-x-2">
                            <Checkbox
                              id={user.user_id}
                              checked={selectedUsers.has(user.user_id)}
                              onCheckedChange={(checked) => 
                                handleUserSelection(user.user_id, checked as boolean)
                              }
                            />
                            <Label 
                              htmlFor={user.user_id} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {user.email}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedUsers.size > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {selectedUsers.size} user(s) selected
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={pauseStartDate}
                    onChange={(e) => setPauseStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">End Date (optional)</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={pauseEndDate}
                    onChange={(e) => setPauseEndDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty for indefinite pause
                  </p>
                </div>

                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Holiday closure, Emergency maintenance, Supply shortage"
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handlePauseSubmit}
                    disabled={pauseSubmitting}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {pauseSubmitting ? 'Pausing...' : 'Pause Subscriptions'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPauseDialog(false)}
                    disabled={pauseSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Play className="h-4 w-4 mr-2" />
                Reactivate Subscriptions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Reactivate Subscriptions</DialogTitle>
                <DialogDescription>
                  Reactivate admin-paused subscriptions and update their schedules.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reactivate-type">Reactivation Type</Label>
                  <Select value={reactivateType} onValueChange={(value: 'all_paused' | 'selected') => setReactivateType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_paused">All Admin-Paused Subscriptions</SelectItem>
                      <SelectItem value="selected">Selected Subscriptions/Pause</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reactivateType === 'selected' && (
                  <>
                    <div>
                      <Label htmlFor="admin-pause-id">Admin Pause ID (optional)</Label>
                      <Select value={selectedAdminPauseId} onValueChange={setSelectedAdminPauseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an admin pause" />
                        </SelectTrigger>
                        <SelectContent>
                          {adminPauses.filter(p => p.status === 'active').map(pause => (
                            <SelectItem key={pause.id} value={pause.id}>
                              {pause.pause_type} - {pause.reason} ({formatDate(pause.start_date)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="subscription-ids">Subscription IDs (comma-separated, optional if Admin Pause ID selected)</Label>
                      <Textarea
                        id="subscription-ids"
                        placeholder="sub-id-1, sub-id-2, sub-id-3"
                        value={selectedSubscriptionIds}
                        onChange={(e) => setSelectedSubscriptionIds(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Reactivated subscriptions will have their end dates extended by the pause duration
                    and new delivery schedules will be generated.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleReactivateSubmit}
                    disabled={reactivateSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {reactivateSubmitting ? 'Reactivating...' : 'Reactivate Subscriptions'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReactivateDialog(false)}
                    disabled={reactivateSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="pauses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pauses">Admin Pauses</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="pauses">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pause className="h-5 w-5" />
                  Admin Pause History
                </CardTitle>
                <CardDescription>
                  All admin-initiated subscription pauses and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminPauses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No admin pauses found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {adminPauses.map((pause) => (
                      <div key={pause.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={pause.pause_type === 'all' ? 'destructive' : 'outline'}>
                                {pause.pause_type === 'all' ? 'All Users' : 'Selected Users'}
                              </Badge>
                              {getStatusBadge(pause.status)}
                              <span className="text-sm text-muted-foreground">
                                {pause.affected_subscription_count} subscriptions affected
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{pause.reason}</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  Start: {formatDate(pause.start_date)}
                                </div>
                                {pause.end_date && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    End: {formatDate(pause.end_date)}
                                  </div>
                                )}
                                {pause.reactivated_at && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    Reactivated: {formatDate(pause.reactivated_at)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {pause.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAdminPauseId(pause.id);
                                setReactivateType('selected');
                                setShowReactivateDialog(true);
                              }}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Admin Action Audit Log
                </CardTitle>
                <CardDescription>
                  Recent admin actions on subscription management
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {log.action.replace('ADMIN_', '').replace('_', ' ').toLowerCase()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(log.created_at)}
                            </p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {log.details?.processedCount && (
                              <p>{log.details.processedCount} subscriptions affected</p>
                            )}
                            {log.details?.pauseType && (
                              <p>Type: {log.details.pauseType}</p>
                            )}
                          </div>
                        </div>
                        {log.details?.reason && (
                          <p className="text-sm mt-1 text-muted-foreground">
                            Reason: {log.details.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
