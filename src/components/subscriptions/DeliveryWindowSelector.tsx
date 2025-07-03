'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface TimeWindow {
  window_id: string;
  window_name: string;
  start_time: string;
  end_time: string;
  delivery_fee: number;
  available_slots: number;
  is_preferred: boolean;
  is_alternative: boolean;
}

interface DeliveryWindowSelectorProps {
  subscriptionId?: string;
  userId?: string;
  onPreferencesChange?: (preferences: any) => void;
  selectedDate?: string;
}

export default function DeliveryWindowSelector({ 
  subscriptionId, 
  userId, 
  onPreferencesChange,
  selectedDate 
}: DeliveryWindowSelectorProps) {
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([]);
  const [selectedWindow, setSelectedWindow] = useState<string>('');
  const [alternativeWindow, setAlternativeWindow] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isFlexible, setIsFlexible] = useState(true);
  const [preferredDays, setPreferredDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [avoidDays, setAvoidDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchTimeWindows();
  }, [deliveryDate, userId]);

  const fetchTimeWindows = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        date: deliveryDate,
        ...(userId && { userId })
      });

      const response = await fetch(`/api/delivery-windows?${params}`);
      if (!response.ok) throw new Error('Failed to fetch time windows');
      
      const result = await response.json();
      setTimeWindows(result.data.time_windows || []);

      // Set preferred window if available
      const preferred = result.data.time_windows?.find((tw: TimeWindow) => tw.is_preferred);
      if (preferred) {
        setSelectedWindow(preferred.window_id);
      }

      // Set alternative window if available
      const alternative = result.data.time_windows?.find((tw: TimeWindow) => tw.is_alternative);
      if (alternative) {
        setAlternativeWindow(alternative.window_id);
      }
    } catch (error) {
      console.error('Error fetching time windows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!subscriptionId || !userId) {
      console.error('Subscription ID and User ID are required');
      return;
    }

    setIsSaving(true);
    try {
      const preferences = {
        subscriptionId,
        userId,
        preferredTimeWindowId: selectedWindow,
        alternativeTimeWindowId: alternativeWindow,
        specialInstructions,
        isFlexible,
        preferredDays,
        avoidDays
      };

      const response = await fetch('/api/delivery-windows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) throw new Error('Failed to save preferences');
      
      const result = await response.json();
      
      if (onPreferencesChange) {
        onPreferencesChange(result.data);
      }

      // Show success message (you might want to use a toast notification)
      console.log('Delivery preferences saved successfully');
    } catch (error) {
      console.error('Error saving delivery preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (dayIndex: number, isPrefArray: boolean) => {
    if (isPrefArray) {
      setPreferredDays(prev => 
        prev.includes(dayIndex) 
          ? prev.filter(d => d !== dayIndex)
          : [...prev, dayIndex]
      );
    } else {
      setAvoidDays(prev => 
        prev.includes(dayIndex) 
          ? prev.filter(d => d !== dayIndex)
          : [...prev, dayIndex]
      );
    }
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading delivery windows...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Choose Delivery Time Window
          </CardTitle>
          <CardDescription>
            Select your preferred delivery time for {new Date(deliveryDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Time Windows Grid */}
          <div>
            <label className="block text-sm font-medium mb-3">Available Time Windows</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {timeWindows.map((window) => (
                <div
                  key={window.window_id}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedWindow === window.window_id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    window.available_slots <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => {
                    if (window.available_slots > 0) {
                      setSelectedWindow(window.window_id);
                    }
                  }}
                >
                  {window.is_preferred && (
                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                      Preferred
                    </Badge>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">{window.window_name}</h4>
                    <p className="text-sm text-gray-600">
                      {formatTime(window.start_time)} - {formatTime(window.end_time)}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`${
                        window.available_slots > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {window.available_slots > 0 
                          ? `${window.available_slots} slots available`
                          : 'Fully booked'
                        }
                      </span>
                      
                      {window.delivery_fee > 0 && (
                        <span className="text-orange-600 font-medium">
                          +${window.delivery_fee}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedWindow === window.window_id && (
                    <CheckCircle className="absolute top-2 left-2 h-5 w-5 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Alternative Window */}
          {selectedWindow && (
            <div>
              <label className="block text-sm font-medium mb-3">Alternative Time Window (Optional)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {timeWindows
                  .filter(window => window.window_id !== selectedWindow && window.available_slots > 0)
                  .map((window) => (
                    <div
                      key={window.window_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        alternativeWindow === window.window_id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setAlternativeWindow(
                        alternativeWindow === window.window_id ? '' : window.window_id
                      )}
                    >
                      <div className="space-y-1">
                        <h5 className="text-sm font-medium">{window.window_name}</h5>
                        <p className="text-xs text-gray-600">
                          {formatTime(window.start_time)} - {formatTime(window.end_time)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Delivery Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preferred Days */}
          <div>
            <label className="block text-sm font-medium mb-3">Preferred Delivery Days</label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((day, index) => (
                <Button
                  key={day}
                  type="button"
                  variant={preferredDays.includes(index) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleDay(index, true)}
                  className="text-xs"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          {/* Days to Avoid */}
          <div>
            <label className="block text-sm font-medium mb-3">Days to Avoid (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((day, index) => (
                <Button
                  key={day}
                  type="button"
                  variant={avoidDays.includes(index) ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => toggleDay(index, false)}
                  className="text-xs"
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>

          {/* Flexibility Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="flexible"
              checked={isFlexible}
              onCheckedChange={(checked) => setIsFlexible(checked as boolean)}
            />
            <label htmlFor="flexible" className="text-sm">
              Allow flexible scheduling if preferred time is unavailable
            </label>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Special Delivery Instructions (Optional)
            </label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., Leave at front door, Ring doorbell twice, etc."
              rows={3}
            />
          </div>

          {/* Save Button */}
          {subscriptionId && userId && (
            <Button 
              onClick={handleSavePreferences} 
              disabled={isSaving || !selectedWindow}
              className="w-full"
            >
              {isSaving ? 'Saving...' : 'Save Delivery Preferences'}
            </Button>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p>Your delivery preferences will be applied to all future deliveries. You can update them anytime in your subscription settings.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
