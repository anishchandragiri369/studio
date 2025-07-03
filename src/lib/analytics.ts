import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RevenueData {
  date: string;
  total_revenue: number;
  gift_revenue: number;
  family_revenue: number;
  corporate_revenue: number;
  transfer_fees: number;
}

interface CustomerAcquisitionData {
  period: string;
  new_customers: number;
  gift_acquisitions: number;
  family_acquisitions: number;
  corporate_acquisitions: number;
  conversion_rate: number;
}

interface ChurnAnalysisData {
  period: string;
  churned_customers: number;
  churn_rate: number;
  churn_reasons: {
    reason: string;
    count: number;
  }[];
  retention_rate: number;
}

export const calculateRevenueTrends = async (
  startDate: string, 
  endDate: string,
  granularity: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<RevenueData[]> => {
  try {
    // Base subscription revenue
    const { data: subscriptionRevenue } = await supabase
      .from('user_subscriptions')
      .select(`
        created_at,
        final_price,
        total_amount
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Gift subscription revenue
    const { data: giftRevenue } = await supabase
      .from('gift_subscriptions')
      .select(`
        created_at,
        total_amount,
        status
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'claimed');

    // Corporate subscription revenue
    const { data: corporateRevenue } = await supabase
      .from('corporate_subscriptions')
      .select(`
        created_at,
        corporate_contribution,
        employee_contribution
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Transfer marketplace fees
    const { data: transferFees } = await supabase
      .from('subscription_transfer_transactions')
      .select(`
        created_at,
        platform_fee
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('payment_status', 'completed');

    // Group data by time period
    const revenueMap = new Map<string, RevenueData>();

    // Process subscription revenue
    subscriptionRevenue?.forEach(sub => {
      const periodKey = formatDateByGranularity(sub.created_at, granularity);
      const existing = revenueMap.get(periodKey) || {
        date: periodKey,
        total_revenue: 0,
        gift_revenue: 0,
        family_revenue: 0,
        corporate_revenue: 0,
        transfer_fees: 0
      };
      existing.total_revenue += sub.final_price || sub.total_amount;
      revenueMap.set(periodKey, existing);
    });

    // Process gift revenue
    giftRevenue?.forEach(gift => {
      const periodKey = formatDateByGranularity(gift.created_at, granularity);
      const existing = revenueMap.get(periodKey) || {
        date: periodKey,
        total_revenue: 0,
        gift_revenue: 0,
        family_revenue: 0,
        corporate_revenue: 0,
        transfer_fees: 0
      };
      existing.gift_revenue += gift.total_amount;
      revenueMap.set(periodKey, existing);
    });

    // Process corporate revenue
    corporateRevenue?.forEach(corp => {
      const periodKey = formatDateByGranularity(corp.created_at, granularity);
      const existing = revenueMap.get(periodKey) || {
        date: periodKey,
        total_revenue: 0,
        gift_revenue: 0,
        family_revenue: 0,
        corporate_revenue: 0,
        transfer_fees: 0
      };
      existing.corporate_revenue += corp.corporate_contribution + corp.employee_contribution;
      revenueMap.set(periodKey, existing);
    });

    // Process transfer fees
    transferFees?.forEach(transfer => {
      const periodKey = formatDateByGranularity(transfer.created_at, granularity);
      const existing = revenueMap.get(periodKey) || {
        date: periodKey,
        total_revenue: 0,
        gift_revenue: 0,
        family_revenue: 0,
        corporate_revenue: 0,
        transfer_fees: 0
      };
      existing.transfer_fees += transfer.platform_fee;
      revenueMap.set(periodKey, existing);
    });

    return Array.from(revenueMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  } catch (error) {
    console.error('Error calculating revenue trends:', error);
    throw new Error('Failed to calculate revenue trends');
  }
};

export const getAcquisitionMetrics = async (
  startDate: string,
  endDate: string,
  granularity: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<CustomerAcquisitionData[]> => {
  try {
    // Get new customers from regular subscriptions
    const { data: newSubscriptions } = await supabase
      .from('user_subscriptions')
      .select(`
        user_id,
        created_at
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    // Get customers acquired through gifts
    const { data: giftAcquisitions } = await supabase
      .from('gift_subscriptions')
      .select(`
        recipient_user_id,
        claimed_at
      `)
      .gte('claimed_at', startDate)
      .lte('claimed_at', endDate)
      .not('recipient_user_id', 'is', null);

    // Get customers acquired through family groups
    const { data: familyAcquisitions } = await supabase
      .from('family_group_members')
      .select(`
        user_id,
        joined_at
      `)
      .gte('joined_at', startDate)
      .lte('joined_at', endDate);

    // Get customers acquired through corporate programs
    const { data: corporateAcquisitions } = await supabase
      .from('corporate_employees')
      .select(`
        user_id,
        enrollment_date
      `)
      .gte('enrollment_date', startDate)
      .lte('enrollment_date', endDate);

    // Calculate total website visitors (mock data - replace with actual analytics)
    const totalVisitors = await getTotalVisitors(startDate, endDate, granularity);

    const acquisitionMap = new Map<string, CustomerAcquisitionData>();

    // Process regular acquisitions
    newSubscriptions?.forEach(sub => {
      const periodKey = formatDateByGranularity(sub.created_at, granularity);
      const existing = acquisitionMap.get(periodKey) || {
        period: periodKey,
        new_customers: 0,
        gift_acquisitions: 0,
        family_acquisitions: 0,
        corporate_acquisitions: 0,
        conversion_rate: 0
      };
      existing.new_customers += 1;
      acquisitionMap.set(periodKey, existing);
    });

    // Process gift acquisitions
    giftAcquisitions?.forEach(gift => {
      const periodKey = formatDateByGranularity(gift.claimed_at!, granularity);
      const existing = acquisitionMap.get(periodKey) || {
        period: periodKey,
        new_customers: 0,
        gift_acquisitions: 0,
        family_acquisitions: 0,
        corporate_acquisitions: 0,
        conversion_rate: 0
      };
      existing.gift_acquisitions += 1;
      acquisitionMap.set(periodKey, existing);
    });

    // Process family acquisitions
    familyAcquisitions?.forEach(family => {
      const periodKey = formatDateByGranularity(family.joined_at, granularity);
      const existing = acquisitionMap.get(periodKey) || {
        period: periodKey,
        new_customers: 0,
        gift_acquisitions: 0,
        family_acquisitions: 0,
        corporate_acquisitions: 0,
        conversion_rate: 0
      };
      existing.family_acquisitions += 1;
      acquisitionMap.set(periodKey, existing);
    });

    // Process corporate acquisitions
    corporateAcquisitions?.forEach(corp => {
      const periodKey = formatDateByGranularity(corp.enrollment_date, granularity);
      const existing = acquisitionMap.get(periodKey) || {
        period: periodKey,
        new_customers: 0,
        gift_acquisitions: 0,
        family_acquisitions: 0,
        corporate_acquisitions: 0,
        conversion_rate: 0
      };
      existing.corporate_acquisitions += 1;
      acquisitionMap.set(periodKey, existing);
    });

    // Calculate conversion rates
    const result = Array.from(acquisitionMap.values()).map(data => {
      const totalAcquisitions = data.new_customers + data.gift_acquisitions + 
                               data.family_acquisitions + data.corporate_acquisitions;
      const visitors = totalVisitors.get(data.period) || 1000; // Fallback
      data.conversion_rate = (totalAcquisitions / visitors) * 100;
      return data;
    });

    return result.sort((a, b) => a.period.localeCompare(b.period));

  } catch (error) {
    console.error('Error getting acquisition metrics:', error);
    throw new Error('Failed to get acquisition metrics');
  }
};

export const analyzeChurnPatterns = async (
  startDate: string,
  endDate: string,
  granularity: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<ChurnAnalysisData[]> => {
  try {
    // Get cancelled subscriptions
    const { data: cancelledSubs } = await supabase
      .from('user_subscriptions')
      .select(`
        user_id,
        updated_at,
        pause_reason,
        status
      `)
      .gte('updated_at', startDate)
      .lte('updated_at', endDate)
      .in('status', ['cancelled', 'expired']);

    // Get expired gift subscriptions
    const { data: expiredGifts } = await supabase
      .from('gift_subscriptions')
      .select(`
        created_at,
        status
      `)
      .gte('expires_at', startDate)
      .lte('expires_at', endDate)
      .eq('status', 'expired');

    // Get family group departures
    const { data: familyDepartures } = await supabase
      .from('family_group_members')
      .select(`
        user_id,
        joined_at
      `)
      .gte('joined_at', startDate)
      .lte('joined_at', endDate)
      .eq('is_active', false);

    // Get total active customers for each period
    const { data: totalCustomers } = await supabase
      .from('user_subscriptions')
      .select(`
        user_id,
        created_at,
        status
      `)
      .eq('status', 'active');

    const churnMap = new Map<string, ChurnAnalysisData>();

    // Process cancelled subscriptions
    cancelledSubs?.forEach(sub => {
      const periodKey = formatDateByGranularity(sub.updated_at, granularity);
      const existing = churnMap.get(periodKey) || {
        period: periodKey,
        churned_customers: 0,
        churn_rate: 0,
        churn_reasons: [],
        retention_rate: 0
      };
      existing.churned_customers += 1;
      
      // Track churn reasons
      const reason = sub.pause_reason || 'Unknown';
      const reasonIndex = existing.churn_reasons.findIndex(r => r.reason === reason);
      if (reasonIndex >= 0) {
        existing.churn_reasons[reasonIndex].count += 1;
      } else {
        existing.churn_reasons.push({ reason, count: 1 });
      }
      
      churnMap.set(periodKey, existing);
    });

    // Calculate churn rates and retention rates
    const result = Array.from(churnMap.values()).map(data => {
      const totalActive = totalCustomers?.length || 1;
      data.churn_rate = (data.churned_customers / totalActive) * 100;
      data.retention_rate = 100 - data.churn_rate;
      
      // Sort churn reasons by frequency
      data.churn_reasons.sort((a, b) => b.count - a.count);
      
      return data;
    });

    return result.sort((a, b) => a.period.localeCompare(b.period));

  } catch (error) {
    console.error('Error analyzing churn patterns:', error);
    throw new Error('Failed to analyze churn patterns');
  }
};

// Helper function to format dates by granularity
const formatDateByGranularity = (dateString: string, granularity: 'daily' | 'weekly' | 'monthly'): string => {
  const date = new Date(dateString);
  
  switch (granularity) {
    case 'daily':
      return date.toISOString().split('T')[0];
    case 'weekly':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return weekStart.toISOString().split('T')[0];
    case 'monthly':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    default:
      return date.toISOString().split('T')[0];
  }
};

// Mock function for total visitors - replace with actual analytics integration
const getTotalVisitors = async (
  startDate: string, 
  endDate: string, 
  granularity: 'daily' | 'weekly' | 'monthly'
): Promise<Map<string, number>> => {
  // This should be replaced with actual analytics data from Google Analytics, etc.
  const visitorsMap = new Map<string, number>();
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const periodKey = formatDateByGranularity(d.toISOString(), granularity);
    if (!visitorsMap.has(periodKey)) {
      // Mock data - replace with actual visitor counts
      visitorsMap.set(periodKey, Math.floor(Math.random() * 2000) + 1000);
    }
  }
  
  return visitorsMap;
};

// Advanced analytics functions
export const getSubscriptionAnalytics = async (dateRange?: { start: string; end: string }) => {
  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const defaultEnd = new Date().toISOString();
  
  const start = dateRange?.start || defaultStart;
  const end = dateRange?.end || defaultEnd;

  try {
    const [revenueTrends, customerAcquisition, churnAnalysis] = await Promise.all([
      calculateRevenueTrends(start, end, 'daily'),
      getAcquisitionMetrics(start, end, 'daily'),
      analyzeChurnPatterns(start, end, 'monthly')
    ]);

    return {
      revenue_trends: revenueTrends,
      customer_acquisition: customerAcquisition,
      churn_analysis: churnAnalysis,
      summary: {
        total_revenue: revenueTrends.reduce((sum, day) => sum + day.total_revenue, 0),
        total_new_customers: customerAcquisition.reduce((sum, day) => sum + day.new_customers, 0),
        average_churn_rate: churnAnalysis.reduce((sum, month) => sum + month.churn_rate, 0) / churnAnalysis.length,
        growth_rate: calculateGrowthRate(revenueTrends)
      }
    };
  } catch (error) {
    console.error('Error getting subscription analytics:', error);
    throw error;
  }
};

// Helper function to calculate growth rate
const calculateGrowthRate = (revenueTrends: RevenueData[]): number => {
  if (revenueTrends.length < 2) return 0;
  
  const firstWeek = revenueTrends.slice(0, 7).reduce((sum, day) => sum + day.total_revenue, 0);
  const lastWeek = revenueTrends.slice(-7).reduce((sum, day) => sum + day.total_revenue, 0);
  
  return firstWeek > 0 ? ((lastWeek - firstWeek) / firstWeek) * 100 : 0;
};
