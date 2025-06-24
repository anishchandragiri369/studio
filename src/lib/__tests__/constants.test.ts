import { JUICES, SUBSCRIPTION_PLANS, TRADITIONAL_JUICE_CATEGORIES } from '@/lib/constants'

describe('Constants', () => {
  describe('JUICES', () => {
    it('should contain juice items', () => {
      expect(JUICES).toBeDefined()
      expect(Array.isArray(JUICES)).toBe(true)
      expect(JUICES.length).toBeGreaterThan(0)
    })

    it('should have juice items with required properties', () => {
      const firstJuice = JUICES[0]
      expect(firstJuice).toHaveProperty('id')
      expect(firstJuice).toHaveProperty('name')
      expect(firstJuice).toHaveProperty('flavor')
      expect(firstJuice).toHaveProperty('price')
      expect(firstJuice).toHaveProperty('image')
      expect(typeof firstJuice.price).toBe('number')
    })
  })

  describe('SUBSCRIPTION_PLANS', () => {
    it('should contain subscription plan items', () => {
      expect(SUBSCRIPTION_PLANS).toBeDefined()
      expect(Array.isArray(SUBSCRIPTION_PLANS)).toBe(true)
      expect(SUBSCRIPTION_PLANS.length).toBeGreaterThan(0)
    })

    it('should have subscription plans with required properties', () => {
      const firstPlan = SUBSCRIPTION_PLANS[0]
      expect(firstPlan).toHaveProperty('id')
      expect(firstPlan).toHaveProperty('name')
      expect(firstPlan).toHaveProperty('frequency')
      expect(firstPlan).toHaveProperty('pricePerDelivery')
      expect(firstPlan).toHaveProperty('description')
      expect(typeof firstPlan.pricePerDelivery).toBe('number')
    })
  })
  describe('TRADITIONAL_JUICE_CATEGORIES', () => {
    it('should contain category items', () => {
      expect(TRADITIONAL_JUICE_CATEGORIES).toBeDefined()
      expect(Array.isArray(TRADITIONAL_JUICE_CATEGORIES)).toBe(true)
      expect(TRADITIONAL_JUICE_CATEGORIES.length).toBeGreaterThan(0)
    })

    it('should contain valid category names', () => {
      const firstCategory = TRADITIONAL_JUICE_CATEGORIES[0]
      expect(typeof firstCategory).toBe('string')
      expect(firstCategory.length).toBeGreaterThan(0)
      expect(TRADITIONAL_JUICE_CATEGORIES).toContain('Fruit Blast')
      expect(TRADITIONAL_JUICE_CATEGORIES).toContain('Green Power')
    })
  })
})
