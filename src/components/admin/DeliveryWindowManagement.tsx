'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TimeWindow {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  delivery_fee_modifier: number;
  max_capacity: number;
  days_of_week: number[];
  stats?: {
    today_bookings: number;
    weekly_bookings: number;
    available_slots: number;
    utilization_rate: number;
    is_full: boolean;
  };
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DeliveryWindowManagement() {
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWindow, setEditingWindow] = useState<TimeWindow | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    isActive: true,
    deliveryFeeModifier: 0,
    maxCapacity: 50,
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7] // All days by default
  });

  useEffect(() => {
    fetchTimeWindows();
  }, []);

  const fetchTimeWindows = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/delivery-windows?includeStats=true');
      if (!response.ok) throw new Error('Failed to fetch time windows');
      
      const result = await response.json();
      setTimeWindows(result.data || []);
    } catch (error) {
      console.error('Error fetching time windows:', error);
      setError('Failed to load delivery windows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingWindow 
        ? '/api/admin/delivery-windows' 
        : '/api/admin/delivery-windows';
      
      const method = editingWindow ? 'PUT' : 'POST';
      
      const payload = editingWindow 
        ? { id: editingWindow.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save time window');
      }

      setSuccess(editingWindow ? 'Time window updated successfully' : 'Time window created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchTimeWindows();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleEdit = (window: TimeWindow) => {
    setEditingWindow(window);
    setFormData({
      name: window.name,
      startTime: window.start_time,
      endTime: window.end_time,
      isActive: window.is_active,
      deliveryFeeModifier: window.delivery_fee_modifier,
      maxCapacity: window.max_capacity,
      daysOfWeek: window.days_of_week
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (windowId: string) => {
    if (!confirm('Are you sure you want to delete this time window?')) return;

    try {
      const response = await fetch(`/api/admin/delivery-windows?id=${windowId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete time window');
      }

      setSuccess('Time window deleted successfully');
      fetchTimeWindows();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete time window');
    }
  };

  const toggleWindowStatus = async (window: TimeWindow) => {
    try {
      const response = await fetch('/api/admin/delivery-windows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: window.id,
          isActive: !window.is_active
        })
      });

      if (!response.ok) throw new Error('Failed to update window status');

      fetchTimeWindows();
    } catch (error) {
      setError('Failed to update window status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      isActive: true,
      deliveryFeeModifier: 0,
      maxCapacity: 50,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7]
    });
    setEditingWindow(null);
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600 bg-red-50';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading delivery windows...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delivery Time Windows</h2>
          <p className="text-gray-600 mt-1">Manage delivery time slots and capacity</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Window
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingWindow ? 'Edit Time Window' : 'Create Time Window'}
              </DialogTitle>
              <DialogDescription>
                {editingWindow 
                  ? 'Update the delivery time window settings'
                  : 'Create a new delivery time window for customers to choose from'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Delivery"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value + ':00' })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value + ':00' })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Capacity</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fee Modifier ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.deliveryFeeModifier}
                    onChange={(e) => setFormData({ ...formData, deliveryFeeModifier: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Available Days</label>
                <div className="flex flex-wrap gap-2">
                  {dayNames.map((day, index) => (
                    <Button
                      key={day}
                      type="button"
                      variant={formData.daysOfWeek.includes(index) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newDays = formData.daysOfWeek.includes(index)
                          ? formData.daysOfWeek.filter(d => d !== index)
                          : [...formData.daysOfWeek, index];
                        setFormData({ ...formData, daysOfWeek: newDays });
                      }}
                      className="text-xs"
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <label htmlFor="isActive" className="text-sm">Active</label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingWindow ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Windows</p>
                <p className="text-2xl font-bold">{timeWindows.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Windows</p>
                <p className="text-2xl font-bold">
                  {timeWindows.filter(w => w.is_active).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-bold">
                  {timeWindows.reduce((sum, w) => sum + (w.stats?.today_bookings || 0), 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
                <p className="text-2xl font-bold">
                  {timeWindows.length > 0 
                    ? Math.round(timeWindows.reduce((sum, w) => sum + (w.stats?.utilization_rate || 0), 0) / timeWindows.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Windows List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {timeWindows.map((window) => (
          <Card key={window.id} className={`${!window.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{window.name}</CardTitle>
                  <CardDescription>
                    {formatTime(window.start_time)} - {formatTime(window.end_time)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={window.is_active ? 'default' : 'secondary'}>
                    {window.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {window.stats?.is_full && (
                    <Badge variant="destructive">Full</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Capacity and utilization */}
                <div className="flex items-center justify-between text-sm">
                  <span>Capacity</span>
                  <span className="font-medium">
                    {window.stats?.today_bookings || 0}/{window.max_capacity}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (window.stats?.utilization_rate || 0) >= 90 ? 'bg-red-500' :
                      (window.stats?.utilization_rate || 0) >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(window.stats?.utilization_rate || 0, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>Utilization: {Math.round(window.stats?.utilization_rate || 0)}%</span>
                  <span>Weekly: {window.stats?.weekly_bookings || 0} bookings</span>
                </div>

                {/* Additional info */}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div>
                    {window.delivery_fee_modifier > 0 && (
                      <span className="text-orange-600">+${window.delivery_fee_modifier} fee</span>
                    )}
                    {window.delivery_fee_modifier === 0 && (
                      <span className="text-green-600">No extra fee</span>
                    )}
                  </div>
                  <div className="text-gray-600">
                    {window.days_of_week.length === 7 ? 'Every day' : 
                     `${window.days_of_week.length} days/week`}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(window)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant={window.is_active ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => toggleWindowStatus(window)}
                  >
                    {window.is_active ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(window.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {timeWindows.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery windows configured</h3>
              <p className="text-gray-600 mb-4">Create your first delivery time window to get started.</p>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Time Window
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
