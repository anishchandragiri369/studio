import type { Juice, SubscriptionPlan, Order, SubscriptionDurationOption } from './types';

export const JUICES: Juice[] = [
  {
    id: '1',
    name: 'Rejoice',
    flavor: 'pomogranate, grape, strawberry, dragon',
    price: 120.00,
    image: '/images/juice-1.jpeg',
    dataAiHint: 'pomogranate grape juice',
    description: 'A vibrant blend of sweet pomogranate, grapes, and a spicy kick of ginger. Perfect to start your day.',
    category: 'Fruit Blast',
    tags: ['energizing', 'vitamin c', 'morning', 'Immunity Booster', 'Seasonal Specials'],
    availability: 'In Stock',
    stockQuantity: 50,
  },
  {
    id: '2',
    name: 'Green Vitality',
    flavor: 'Kale, Spinach, Apple, Lemon',
    price: 120.00,
    image: '/images/juice-2.jpeg',
    dataAiHint: 'green smoothie',
    description: 'Packed with leafy greens, crisp apple, and zesty lemon for a refreshing and nutritious boost.',
    category: 'Green Power',
    tags: ['detox', 'healthy', 'greens', 'Immunity Booster', 'Radiant Health', 'Detoxify', 'Daily Wellness'],
    availability: 'In Stock',
    stockQuantity: 75,
  },
  {
    id: '3',
    name: 'Berry Bliss',
    flavor: 'Strawberry, Blueberry, Raspberry, Banana',
    price: 120.00,
    image: '/images/juice-3.jpeg',
    dataAiHint: 'berry smoothie',
    description: 'A delightful mix of sweet berries and creamy banana, rich in antioxidants.',
    category: 'Fruit Blast',
    tags: ['antioxidant', 'sweet', 'smoothie', 'Skin Glow', 'Kids Friendly'],
    availability: 'Low Stock',
    stockQuantity: 5,
  },
  {
    id: '4',
    name: 'Tropical Escape',
    flavor: 'Pineapple, Mango, Coconut Water',
    price: 120.00,
    image: '/images/juice-4.jpeg',
    dataAiHint: 'tropical drink',
    description: 'Experience a taste of the tropics with this exotic blend of pineapple, mango, and hydrating coconut water.',
    category: 'Exotic Flavors',
    tags: ['tropical', 'hydrating', 'refreshing', 'Energy Kick', 'Seasonal Specials'],
    availability: 'In Stock',
    stockQuantity: 60,
  },
  {
    id: '5',
    name: 'Beet Boost',
    flavor: 'Beetroot, Apple, Carrot, Lemon',
    price: 120.00,
    image: '/images/juice-5.jpeg',
    dataAiHint: 'beet juice',
    description: 'An earthy and energizing juice featuring beetroot, balanced with sweet apple and carrot.',
    category: 'Veggie Fusion',
    tags: ['earthy', 'stamina', 'nutrient-rich', 'Workout Fuel', 'Detoxify'],
    availability: 'Out of Stock',
    stockQuantity: 0,
  },
  {
    id: '6',
    name: 'Citrus Zing',
    flavor: 'Grapefruit, Orange, Lemon, Lime',
    price: 120.00,
    image: '/images/juice-6.jpeg',
    dataAiHint: 'citrus juice',
    description: 'A zesty and invigorating explosion of citrus fruits, perfect for a pick-me-up.',
    category: 'Fruit Blast',
    tags: ['tangy', 'refreshing', 'vitamin c', 'Immunity Booster', 'Daily Wellness', 'Energy Kick'],
    availability: 'In Stock',
    stockQuantity: 40,
  },  // New Daily Detox Plans
  {
    id: 'dtx0',
    name: '1-Day Custom Detox',
    flavor: 'Customizable - Choose your own juices and fruit bowls',
    price: 899.00, // Base price for the plan
    image: '/images/juice-7.jpeg',
    dataAiHint: 'custom detox',
    description: 'Design your perfect 1-day detox experience. Select a minimum of 5 juices and 2 fruit bowls from our fresh collection.',
    category: 'Detox Plans',
    tags: ['customizable', '1-day plan', 'personalized detox', 'Detoxify', 'Daily Wellness'],
    availability: 'In Stock',
    stockQuantity: 50, // Represents number of plans available
  },
  {
    id: 'dtx1',
    name: '3-Day Green Cleanse',
    flavor: 'Spinach, Kale, Cucumber, Apple, Lemon',
    price: 120.00, // Price for the whole plan
    image: '/images/juice-7.jpeg',
    dataAiHint: 'green detox',
    description: 'A 3-day supply of potent green juices designed to reset your system. Includes a variety of 5 green juices per day.',
    category: 'Detox Plans',
    tags: ['cleanse', 'green juices', '3-day plan', 'healthy reset', 'Detoxify', 'Radiant Health'],
    availability: 'In Stock',
    stockQuantity: 15, // Represents number of plans available
  },
  {
    id: 'dtx2',
    name: '7-Day Rainbow Detox',
    flavor: 'Variety of fruit & vegetable juices',
    price: 99.99, // Price for the whole plan
    image: '/images/juice-8.jpeg',
    dataAiHint: 'colorful juices',
    description: 'A comprehensive 7-day detox program featuring a rainbow of juices to nourish and cleanse. Includes 6 diverse juices daily.',
    category: 'Detox Plans',
    tags: ['full detox', '7-day plan', 'wellness', 'variety pack', 'Detoxify', 'Daily Wellness'],
    availability: 'In Stock',
    stockQuantity: 10, // Represents number of plans available
  },
  // New Fruit Bowls
  {
    id: 'fb1',
    name: 'Morning Berry Bowl',
    flavor: 'Strawberries, Blueberries, Granola, Chia Seeds',
    price: 120.00,
    image: '/images/juice-9.jpeg',
    dataAiHint: 'kiwi carrot',
    description: 'A refreshing bowl of mixed berries, crunchy homemade granola, and nutritious chia seeds. Perfect for a light breakfast.',
    category: 'Fruit Bowls',
    tags: ['breakfast', 'healthy snack', 'berries', 'fresh', 'granola', 'Skin Glow', 'Kids Friendly'],
    availability: 'In Stock',
    stockQuantity: 25,
  },
  {
    id: 'fb2',
    name: 'Tropical Sunshine Bowl',
    flavor: 'Mango, Pineapple, Kiwi, Coconut Flakes',
    price: 120.00,
    image: '/images/fruit-bowl-custom.jpg',
    dataAiHint: 'mango pineapple',
    description: 'An exotic mix of fresh mango, pineapple, kiwi, topped with toasted coconut flakes. A taste of paradise!',
    category: 'Fruit Bowls',
    tags: ['tropical fruits', 'breakfast bowl', 'refreshing', 'exotic', 'Energy Kick', 'Seasonal Specials'],
    availability: 'Low Stock',
    stockQuantity: 8,
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'weekly',
    name: 'Weekly Kickstarter',
    frequency: 'weekly',
    pricePerDelivery: 69.00,
    description: 'Get a fresh batch of curated or custom-selected juices delivered to your doorstep every week. Perfect for starting your week right!',
    defaultJuices: [
      { juiceId: '1', quantity: 1 },
      { juiceId: '2', quantity: 2 },
      { juiceId: '3', quantity: 1 },
      { juiceId: '6', quantity: 1 },
    ],
    isCustomizable: true,
    maxJuices: 5,
  },
  {
    id: 'monthly',
    name: 'Monthly Wellness Pack',
    frequency: 'monthly',
    pricePerDelivery: 2599.00,
    description: 'A comprehensive selection of curated or custom-selected juices delivered monthly. Ideal for maintaining a healthy lifestyle.',
     defaultJuices: [
      { juiceId: '1', quantity: 4 },
      { juiceId: '2', quantity: 4 },
      { juiceId: '3', quantity: 4 },
      { juiceId: '4', quantity: 4 },
      { juiceId: '5', quantity: 2 }, // Note: Juice '5' is Out of Stock by quantity
      { juiceId: '6', quantity: 2 },
    ],
    isCustomizable: true,
    maxJuices: 20,
  },
  {
    id: 'sub3',
    name: 'Custom Weekly',
    frequency: 'weekly',
    pricePerDelivery: 32.99,
    description: 'Choose your own favorite juices for weekly delivery. Tailor your subscription to your taste.',
    isCustomizable: true,
    maxJuices: 5,
  },
];

// Subscription Duration Options with Discounts - Monthly
export const SUBSCRIPTION_DURATION_OPTIONS: SubscriptionDurationOption[] = [
  {
    months: 1,
    discountPercentage: 0,
    discountType: 'bronze',
    label: '1 Month - No Discount'
  },
  {
    months: 3,
    discountPercentage: 5,
    discountType: 'bronze',
    label: '3 Months - 5% OFF'
  },
  {
    months: 6,
    discountPercentage: 12,
    discountType: 'gold',
    label: '6 Months - 12% OFF'
  },
  {
    months: 12,
    discountPercentage: 20,
    discountType: 'platinum',
    label: '1 Year - 20% OFF'
  }
];

// Subscription Duration Options for Weekly subscriptions (in weeks)
export const WEEKLY_SUBSCRIPTION_DURATION_OPTIONS: SubscriptionDurationOption[] = [
  {
    months: 1, // Represents 1 week for weekly subscriptions
    discountPercentage: 0,
    discountType: 'bronze',
    label: '1 Week - No Discount',
    weeks: 1
  },
  {
    months: 2, // Represents 2 weeks for weekly subscriptions
    discountPercentage: 5,
    discountType: 'bronze',
    label: '2 Weeks - 5% OFF',
    weeks: 2
  },
  {
    months: 3, // Represents 3 weeks for weekly subscriptions
    discountPercentage: 10,
    discountType: 'silver',
    label: '3 Weeks - 10% OFF',
    weeks: 3
  }
];

// Custom month selector options (1-11 months)
export const CUSTOM_MONTH_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} Month${i + 1 > 1 ? 's' : ''}`,
  discountPercentage: 0, // No discount for custom selections
  discountType: 'bronze' as const
}));

// Days before subscription end to show renewal notification
export const RENEWAL_NOTIFICATION_DAYS = 5;

export const AVAILABLE_FLAVORS_FOR_AI: string[] = JUICES.map(j => j.flavor);
export const AVAILABLE_JUICE_NAMES_FOR_AI: string[] = JUICES.map(j => j.name);

// Mock data for AI features
export const MOCK_USER_TASTE_PREFERENCES = "Loves sweet and fruity, sometimes tangy. Avoids very earthy or veggie-heavy juices.";
export const MOCK_USER_CONSUMPTION_HABITS = "Drinks juice 3-4 times a week, usually one per serving. Enjoys variety.";
export const MOCK_USER_ORDER_HISTORY = JSON.stringify([
  { juiceName: "Sunrise Orange", quantity: 2, date: "2023-10-01" },
  { juiceName: "Berry Bliss", quantity: 3, date: "2023-10-05" },
  { juiceName: "Tropical Escape", quantity: 1, date: "2023-10-10" },
]);

export const MOCK_AI_PREFERENCES_INPUT = JSON.stringify({
  favoriteFlavors: ["orange", "strawberry", "pineapple", "mango"],
  dietaryRestrictions: ["none"],
  healthGoals: ["more energy", "better hydration"]
});

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Juices' },
  { href: '/daily-detox', label: 'Daily Detox' },
  { href: '/fruit-bowls', label: 'Fruit Bowls' },
  { 
    label: 'Subscriptions', 
    href: '/subscriptions', // Base href for highlighting
    basePath: '/subscriptions', // Base path for highlighting
    subLinks: [
      { href: '/subscriptions/subscribe?plan=weekly', label: 'Weekly Plans' },
      { href: '/subscriptions/subscribe?plan=monthly', label: 'Monthly Plans' },
      { href: '/subscriptions', label: 'View All Plans' },
    ]
  },
  // { href: '/subscriptions', label: 'Subscriptions' }, // Old subscription link

  { href: '/recipe-creator', label: 'Recipe Creator' },
  { href: '/contact', label: 'Contact Us' },
  // Login/Signup links will be handled dynamically in Navbar
];

export const TRADITIONAL_JUICE_CATEGORIES = ['Fruit Blast', 'Green Power', 'Exotic Flavors', 'Veggie Fusion'];

export interface HomeCategory {
  id: string;
  name: string;
  image: string;
  dataAiHint: string;
  href: string;
}

export const HOME_CATEGORIES: HomeCategory[] = [
  {
    id: 'immunity-booster',
    name: 'Immunity Booster',
    image: '/images/category-1.jpeg',
    dataAiHint: 'citrus fruits',
    href: '/menu?category=Immunity%20Booster',
  },
  {
    id: 'skin-glow',
    name: 'Skin Glow',
    image: '/images/category-2.jpeg',
    dataAiHint: 'berries avocado',
    href: '/menu?category=Skin%20Glow',
  },
  {
    id: 'radiant-health',
    name: 'Radiant Health',
    image: '/images/category-3.jpeg',
    dataAiHint: 'green vegetables',
    href: '/menu?category=Radiant%20Health',
  },
  {
    id: 'energy-kick',
    name: 'Energy Kick',
    image: '/images/category-4.jpeg',
    dataAiHint: 'tropical fruits',
    href: '/menu?category=Energy%20Kick',
  },
  {
    id: 'detoxify',
    name: 'Detoxify',
    image: '/images/category-1.jpeg',
    dataAiHint: 'lemon cucumber',
    href: '/menu?category=Detoxify',
  },
  {
    id: 'workout-fuel',
    name: 'Workout Fuel',
    image: '/images/category-2.jpeg',
    dataAiHint: 'banana oats',
    href: '/menu?category=Workout%20Fuel',
  },
  {
    id: 'daily-wellness',
    name: 'Daily Wellness',
    image: '/images/category-3.jpeg',
    dataAiHint: 'apple carrot',
    href: '/menu?category=Daily%20Wellness',
  },
  {
    id: 'kids-friendly',
    name: 'Kids Friendly',
    image: '/images/category-4.jpeg',
    dataAiHint: 'strawberry banana',
    href: '/menu?category=Kids%20Friendly',
  },
  {
    id: 'seasonal-specials',
    name: 'Seasonal Specials',
    image: '/images/category-1.jpeg',
    dataAiHint: 'watermelon mint',
    href: '/menu?category=Seasonal%20Specials',
  },
];

export const MOCK_USER_ORDERS: Order[] = [
  {
    id: 'ORD001',
    orderDate: '2024-05-15T10:30:00Z',
    totalAmount: 240.00,
    status: 'Delivered',
    items: [
      { juiceId: '1', juiceName: 'Rejoice', quantity: 1, pricePerItem: 120.00, image: JUICES.find(j => j.id === '1')?.image },
      { juiceId: '2', juiceName: 'Green Vitality', quantity: 1, pricePerItem: 120.00, image: JUICES.find(j => j.id === '2')?.image },
    ],
    shippingAddress: {
        email: "test@example.com",
        firstName: "Mock",
        lastName: "User",
        addressLine1: "123 Test St",
        city: "Testville",
        state: "TS",
        zipCode: "12345",
        country: "Testland"
    }
  },
  {
    id: 'ORD002',
    orderDate: '2024-05-28T14:00:00Z',
    totalAmount: 360.00,
    status: 'Shipped',
    items: [
      { juiceId: '3', juiceName: 'Berry Bliss', quantity: 2, pricePerItem: 120.00, image: JUICES.find(j => j.id === '3')?.image },
      { juiceId: '4', juiceName: 'Tropical Escape', quantity: 1, pricePerItem: 120.00, image: JUICES.find(j => j.id === '4')?.image },
    ],
  },
  {
    id: 'ORD003',
    orderDate: '2024-06-01T09:15:00Z',
    totalAmount: 120.00,
    status: 'Processing',
    items: [
      { juiceId: '6', juiceName: 'Citrus Zing', quantity: 1, pricePerItem: 120.00, image: JUICES.find(j => j.id === '6')?.image },
    ],
  },
];

export const JUICE_IMAGE_EXAMPLES = [
  '/images/juice-1.jpeg',
  '/images/juice-2.jpeg',
  '/images/juice-3.jpeg',
  '/images/juice-4.jpeg',
  '/images/juice-5.jpeg',
  '/images/juice-6.jpeg',
  '/images/juice-7.jpeg',
  '/images/juice-8.jpeg',
  '/images/juice-9.jpeg',
];

export const CATEGORY_IMAGE_EXAMPLES = [
  '/images/category-1.jpeg',
  '/images/category-2.jpeg',
  '/images/category-3.jpeg',
  '/images/category-4.jpeg',
];
