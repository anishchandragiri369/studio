import { supabase } from '@/lib/supabaseClient';

export interface PlanDefault {
  juiceId: number;
  quantity: number;
  juice: {
    id: number;
    name: string;
    flavor: string;
    price: number;
    description: string;
    category: string;
    tags: string[];
    image: string;
    stock_quantity: number;
    is_active: boolean;
  };
}

export interface PlanDefaultsResponse {
  planId: string;
  defaults: PlanDefault[];
}

/**
 * Fetch default juice selections for a subscription plan
 * @param planId - The plan identifier (e.g., 'weekly-juice', 'monthly-juice')
 * @returns Promise<PlanDefaultsResponse>
 */
export async function fetchPlanDefaults(planId: string): Promise<PlanDefaultsResponse> {
  try {
    const response = await fetch(`/api/subscription-plan-defaults?planId=${encodeURIComponent(planId)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch plan defaults: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching plan defaults:', error);
    // Return empty defaults as fallback
    return {
      planId,
      defaults: []
    };
  }
}

/**
 * Convert plan defaults to the format expected by the subscription UI
 * @param defaults - Array of plan defaults
 * @returns Object with juice IDs as keys and quantities as values
 */
export function convertDefaultsToSelection(defaults: PlanDefault[]): Record<number, number> {
  const selection: Record<number, number> = {};
  
  defaults.forEach(defaultItem => {
    if (defaultItem.juiceId && defaultItem.quantity > 0) {
      selection[defaultItem.juiceId] = defaultItem.quantity;
    }
  });
  
  return selection;
}

/**
 * Get all available juices for plan customization
 * @returns Promise<Array of juice objects>
 */
export async function fetchAvailableJuices() {
  try {
    if (!supabase) {
      console.error('Supabase client not configured');
      return [];
    }
    
    const { data: juices, error } = await supabase
      .from('juices')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching juices:', error);
      return [];
    }
    
    return juices || [];
  } catch (error) {
    console.error('Error fetching available juices:', error);
    return [];
  }
} 