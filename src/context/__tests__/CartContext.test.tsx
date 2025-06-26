import { renderHook, act } from '@testing-library/react'
import { CartProvider } from '@/context/CartContext'
import { useCart } from '@/hooks/useCart'
import { JUICES } from '@/lib/constants'

// Mock the auth context and toast
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    authLoading: false,
  }),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
)

describe('CartContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    
    expect(result.current.cartItems).toEqual([])
    expect(result.current.getItemCount()).toBe(0)
    expect(result.current.getCartTotal()).toBe(0)
  })

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const testJuice = JUICES[0]
    
    act(() => {
      result.current.addToCart(testJuice)
    })
    
    expect(result.current.cartItems).toHaveLength(1)
    expect(result.current.cartItems[0].id).toBe(testJuice.id)
    expect(result.current.cartItems[0].quantity).toBe(1)
    expect(result.current.getItemCount()).toBe(1)
    expect(result.current.getCartTotal()).toBe(testJuice.price)
  })

  it('should increment quantity when adding same item', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const testJuice = JUICES[0]
    
    act(() => {
      result.current.addToCart(testJuice)
      result.current.addToCart(testJuice)
    })
    
    expect(result.current.cartItems).toHaveLength(1)
    expect(result.current.cartItems[0].quantity).toBe(2)
    expect(result.current.getItemCount()).toBe(2)
    expect(result.current.getCartTotal()).toBe(testJuice.price * 2)
  })

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const testJuice = JUICES[0]
    
    act(() => {
      result.current.addToCart(testJuice)
      result.current.removeFromCart(testJuice.id)
    })
    
    expect(result.current.cartItems).toHaveLength(0)
    expect(result.current.getItemCount()).toBe(0)
    expect(result.current.getCartTotal()).toBe(0)
  })

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const testJuice = JUICES[0]
    
    act(() => {
      result.current.addToCart(testJuice)
      result.current.updateQuantity(testJuice.id, 5)
    })
    
    expect(result.current.cartItems[0].quantity).toBe(5)
    expect(result.current.getItemCount()).toBe(5)
    expect(result.current.getCartTotal()).toBe(testJuice.price * 5)
  })

  it('should clear all items from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const testJuice1 = JUICES[0]
    const testJuice2 = JUICES[1]
    
    act(() => {
      result.current.addToCart(testJuice1)
      result.current.addToCart(testJuice2)
      result.current.clearCart()
    })
    
    expect(result.current.cartItems).toHaveLength(0)
    expect(result.current.getItemCount()).toBe(0)
    expect(result.current.getCartTotal()).toBe(0)
  })

  it('should calculate total price correctly with multiple items', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    const testJuice1 = JUICES[0] // Usually 120
    const testJuice2 = JUICES[1] // Usually 120
    
    act(() => {
      result.current.addToCart(testJuice1) // quantity: 1
      result.current.addToCart(testJuice2) // quantity: 1
      result.current.updateQuantity(testJuice1.id, 3) // quantity: 3
    })
    
    const expectedTotal = (testJuice1.price * 3) + (testJuice2.price * 1)
    expect(result.current.getCartTotal()).toBe(expectedTotal)
    expect(result.current.getItemCount()).toBe(4)
  })
})
