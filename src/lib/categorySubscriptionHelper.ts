import type { Juice, SubscriptionPlan } from './types';

export interface CategoryDistribution {
  juiceId: string;
  quantity: number;
  days: number[];
  juice: Juice;
}

export interface CategorySubscriptionData {
  category: string;
  distribution: CategoryDistribution[];
  totalJuices: number;
  subscriptionDays: number;
}

/**
 * Calculate how juices from a specific category should be distributed across a subscription period
 */
export function calculateCategoryDistribution(
  category: string,
  categoryJuices: Juice[],
  plan: SubscriptionPlan
): CategoryDistribution[] {
  const subscriptionDays = plan.frequency === 'weekly' ? 6 : 26; // 6 days for weekly, 26 days for monthly
  const maxJuices = plan.maxJuices || (plan.frequency === 'weekly' ? 6 : 26);
  
  // Filter juices by category (either by category field or tags)
  const filteredJuices = categoryJuices.filter(juice => 
    juice.category === category || 
    (juice.tags && juice.tags.includes(category))
  );

  if (filteredJuices.length === 0) return [];

  // Calculate how many juices to include
  const juicesToInclude = Math.min(filteredJuices.length, maxJuices);
  const selectedJuices = filteredJuices.slice(0, juicesToInclude);
  
  // Calculate quantities to distribute across the subscription period
  const totalJuicesNeeded = maxJuices;
  const juicesPerJuiceType = Math.ceil(totalJuicesNeeded / selectedJuices.length);
  
  const distribution: CategoryDistribution[] = [];
  
  selectedJuices.forEach((juice, index) => {
    const quantity = Math.min(juicesPerJuiceType, totalJuicesNeeded - distribution.reduce((sum, item) => sum + item.quantity, 0));
    
    if (quantity > 0) {
      // Distribute across days for better variety
      const days = distributeJuicesAcrossDays(index, quantity, selectedJuices.length, subscriptionDays);
      
      distribution.push({
        juiceId: juice.id,
        quantity,
        days,
        juice
      });
    }
  });

  return distribution;
}

/**
 * Distribute juices across subscription days for optimal variety
 */
function distributeJuicesAcrossDays(
  juiceIndex: number, 
  quantity: number, 
  totalJuiceTypes: number, 
  subscriptionDays: number
): number[] {
  const days: number[] = [];
  
  // Calculate spacing between deliveries of the same juice
  const spacing = Math.ceil(subscriptionDays / totalJuiceTypes);
  const startDay = (juiceIndex * spacing) + 1;
  
  for (let i = 0; i < quantity; i++) {
    const day = Math.min(startDay + (i * spacing), subscriptionDays);
    if (!days.includes(day)) {
      days.push(day);
    }
  }
  
  // If we still have quantities to distribute, fill remaining days
  if (days.length < quantity) {
    for (let day = 1; day <= subscriptionDays && days.length < quantity; day++) {
      if (!days.includes(day)) {
        days.push(day);
      }
    }
  }
  
  return days.sort((a, b) => a - b);
}

/**
 * Get all available categories from juices
 */
export function getAvailableCategories(juices: Juice[]): string[] {
  const categories = new Set<string>();
  
  // Add traditional categories
  const traditionalCategories = ['Fruit Blast', 'Green Power', 'Exotic Flavors', 'Veggie Fusion'];
  traditionalCategories.forEach(cat => {
    if (juices.some(juice => juice.category === cat)) {
      categories.add(cat);
    }
  });
  
  // Add health-focused categories (from tags)
  const healthCategories = [
    'Immunity Booster', 'Skin Glow', 'Radiant Health', 'Energy Kick',
    'Detoxify', 'Workout Fuel', 'Daily Wellness', 'Kids Friendly', 'Seasonal Specials'
  ];
  
  healthCategories.forEach(cat => {
    if (juices.some(juice => juice.tags && juice.tags.includes(cat))) {
      categories.add(cat);
    }
  });
  
  return Array.from(categories).sort();
}

/**
 * Get juices for a specific category
 */
export function getJuicesForCategory(category: string, juices: Juice[]): Juice[] {
  return juices.filter(juice => 
    juice.category === category || 
    (juice.tags && juice.tags.includes(category))
  );
}

/**
 * Convert category distribution to subscription selections
 */
export function convertDistributionToSelections(distribution: CategoryDistribution[]): Record<string, number> {
  const selections: Record<string, number> = {};
  
  distribution.forEach(item => {
    selections[item.juiceId] = item.quantity;
  });
  
  return selections;
}

/**
 * Get category description for display
 */
export function getCategoryDescription(category: string): string {
  const healthCategories = [
    'Immunity Booster', 'Skin Glow', 'Radiant Health', 'Energy Kick',
    'Detoxify', 'Workout Fuel', 'Daily Wellness', 'Kids Friendly', 'Seasonal Specials'
  ];
  
  if (healthCategories.includes(category)) {
    return `Health-focused ${category.toLowerCase()} juices`;
  }
  
  return `${category} category juices`;
}

/**
 * Validate if a category has enough juices for a subscription
 */
export function validateCategoryForSubscription(
  category: string, 
  juices: Juice[], 
  plan: SubscriptionPlan
): { isValid: boolean; message: string; availableJuices: number } {
  const categoryJuices = getJuicesForCategory(category, juices);
  const maxJuices = plan.maxJuices || (plan.frequency === 'weekly' ? 6 : 26);
  
  if (categoryJuices.length === 0) {
    return {
      isValid: false,
      message: `No juices found in the "${category}" category.`,
      availableJuices: 0
    };
  }
  
  if (categoryJuices.length < Math.min(3, maxJuices)) {
    return {
      isValid: false,
      message: `The "${category}" category only has ${categoryJuices.length} juices. We recommend at least 3 different juices for variety.`,
      availableJuices: categoryJuices.length
    };
  }
  
  return {
    isValid: true,
    message: `Perfect! The "${category}" category has ${categoryJuices.length} juices available.`,
    availableJuices: categoryJuices.length
  };
} 