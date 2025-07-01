"use client";

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, Clock } from 'lucide-react';

interface AdminPauseInfo {
  hasActivePause: boolean;
  pauseInfo?: {
    reason: string;
    startDate: string;
    endDate?: string;
    type: 'all' | 'selected';
    message: string;
  };
}

interface AdminPauseNotificationProps {
  userId?: string;
  className?: string;
}

export default function AdminPauseNotification({ userId, className = "" }: AdminPauseNotificationProps) {
  const [pauseInfo, setPauseInfo] = useState<AdminPauseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminPauseInfo();
  }, [userId]);

  const fetchAdminPauseInfo = async () => {
    try {
      const response = await fetch(`/api/admin/pause-status${userId ? `?userId=${userId}` : ''}`);
      const result = await response.json();
      
      if (result.success) {
        setPauseInfo(result.data);
      }
    } catch (error) {
      console.error('Error fetching admin pause info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Don't show loading state for this component
  }

  if (!pauseInfo?.hasActivePause || !pauseInfo.pauseInfo) {
    return null; // No active pause
  }

  const info = pauseInfo.pauseInfo;
  
  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Service Temporarily Paused
        <Badge variant="outline" className="text-xs">
          {info.type === 'all' ? 'System-wide' : 'Your Account'}
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{info.message}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Since: {new Date(info.startDate).toLocaleDateString()}</span>
          </div>
          {info.endDate && (
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>Expected resume: {new Date(info.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
          <strong>Reason:</strong> {info.reason}
        </div>
      </AlertDescription>
    </Alert>
  );
}
