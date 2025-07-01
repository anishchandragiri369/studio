import { supabase } from '@/lib/supabaseClient';

/**
 * Check if a user or all users are currently under admin pause
 */
export async function checkAdminPauseStatus(userId?: string): Promise<{
  isAdminPaused: boolean;
  pauseReason?: string;
  pauseStartDate?: string;
  pauseEndDate?: string;
  pauseType?: 'all' | 'selected';
}> {
  try {
    if (!supabase) {
      return { isAdminPaused: false };
    }

    const now = new Date().toISOString();

    // Check for active admin pauses
    const { data: adminPauses, error } = await supabase
      .from('admin_subscription_pauses')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', now)
      .or(`end_date.is.null,end_date.gte.${now}`);

    if (error) {
      console.error('Error checking admin pause status:', error);
      return { isAdminPaused: false };
    }

    if (!adminPauses || adminPauses.length === 0) {
      return { isAdminPaused: false };
    }

    // Check if there's an 'all' type pause
    const allPause = adminPauses.find(p => p.pause_type === 'all');
    if (allPause) {
      return {
        isAdminPaused: true,
        pauseReason: allPause.reason,
        pauseStartDate: allPause.start_date,
        pauseEndDate: allPause.end_date,
        pauseType: 'all'
      };
    }

    // Check if user is in a 'selected' type pause
    if (userId) {
      const selectedPause = adminPauses.find(p => 
        p.pause_type === 'selected' && 
        p.affected_user_ids && 
        p.affected_user_ids.includes(userId)
      );
      
      if (selectedPause) {
        return {
          isAdminPaused: true,
          pauseReason: selectedPause.reason,
          pauseStartDate: selectedPause.start_date,
          pauseEndDate: selectedPause.end_date,
          pauseType: 'selected'
        };
      }
    }

    return { isAdminPaused: false };
  } catch (error) {
    console.error('Error in checkAdminPauseStatus:', error);
    return { isAdminPaused: false };
  }
}

/**
 * Block subscription creation/modification if admin pause is active
 */
export async function validateAdminPauseForSubscription(userId: string): Promise<{
  canProceed: boolean;
  message?: string;
}> {
  const pauseStatus = await checkAdminPauseStatus(userId);
  
  if (pauseStatus.isAdminPaused) {
    const endMessage = pauseStatus.pauseEndDate 
      ? ` until ${new Date(pauseStatus.pauseEndDate).toLocaleDateString()}`
      : '';
    
    return {
      canProceed: false,
      message: `Subscription services are temporarily paused ${endMessage}. Reason: ${pauseStatus.pauseReason}`
    };
  }
  
  return { canProceed: true };
}

/**
 * Get admin pause information for user display
 */
export async function getAdminPauseInfo(userId?: string): Promise<{
  hasActivePause: boolean;
  pauseInfo?: {
    reason: string;
    startDate: string;
    endDate?: string;
    type: 'all' | 'selected';
    message: string;
  };
}> {
  const pauseStatus = await checkAdminPauseStatus(userId);
  
  if (!pauseStatus.isAdminPaused) {
    return { hasActivePause: false };
  }
  
  const endMessage = pauseStatus.pauseEndDate 
    ? ` Expected to resume on ${new Date(pauseStatus.pauseEndDate).toLocaleDateString()}.`
    : ' Please check back later for updates.';
  
  const typeMessage = pauseStatus.pauseType === 'all' 
    ? 'All subscription services are temporarily paused.'
    : 'Your subscription services are temporarily paused.';
  
  return {
    hasActivePause: true,
    pauseInfo: {
      reason: pauseStatus.pauseReason!,
      startDate: pauseStatus.pauseStartDate!,
      endDate: pauseStatus.pauseEndDate,
      type: pauseStatus.pauseType!,
      message: `${typeMessage} ${pauseStatus.pauseReason}${endMessage}`
    }
  };
}
