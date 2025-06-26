import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('text-red-500', 'bg-blue-500')
      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
    })

    it('should handle falsy conditional classes', () => {
      const isActive = false
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toContain('base-class')
      expect(result).not.toContain('active-class')
    })

    it('should merge overlapping Tailwind classes correctly', () => {
      const result = cn('p-2', 'p-4') // p-4 should override p-2
      expect(result).toBe('p-4')
    })

    it('should handle empty inputs', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle undefined and null inputs', () => {
      const result = cn('text-red-500', undefined, null, 'bg-blue-500')
      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle array inputs', () => {
      const result = cn(['text-red-500', 'bg-blue-500'])
      expect(result).toContain('text-red-500')
      expect(result).toContain('bg-blue-500')
    })

    it('should handle complex combinations', () => {
      const isLarge = true
      const isRed = false
      const result = cn(
        'base-class',
        {
          'large-class': isLarge,
          'red-class': isRed,
        },
        'additional-class'
      )
      
      expect(result).toContain('base-class')
      expect(result).toContain('large-class')
      expect(result).not.toContain('red-class')
      expect(result).toContain('additional-class')
    })
  })
})
