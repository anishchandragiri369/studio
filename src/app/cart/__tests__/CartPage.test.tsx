import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import CartPage from '@/app/cart/page'
import { CartProvider } from '@/context/CartContext'
import React from 'react'

// Mock the AuthContext completely to avoid the AuthProvider dependency
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isAdmin: false,
    signUp: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    sendPasswordReset: jest.fn(),
    isSupabaseConfigured: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock cart components
jest.mock('@/components/cart/CartItem', () => {
  return function MockCartItem({ item }: { item: any }) {
    return <div data-testid="cart-item">{item.name}</div>
  }
})

jest.mock('@/components/cart/CartSummary', () => {
  return function MockCartSummary() {
    return <div data-testid="cart-summary">Cart Summary</div>
  }
})

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  )
}

describe('CartPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders the cart page', () => {
    renderWithProviders(<CartPage />)
    expect(screen.getByText('Your Shopping Cart')).toBeInTheDocument()
  })

  it('shows empty cart state when no items', () => {
    renderWithProviders(<CartPage />)
    expect(screen.getByText(/empty/i) || screen.getByText(/no items/i)).toBeInTheDocument()
  })
  it('displays empty cart message and explore link', () => {
    renderWithProviders(<CartPage />)
    expect(screen.getByText('Your cart is empty!')).toBeInTheDocument()
    expect(screen.getByText('Explore Our Juices')).toBeInTheDocument()
  })

  it('has proper page styling', () => {
    const { container } = renderWithProviders(<CartPage />)
    const pageContainer = container.querySelector('.container')
    expect(pageContainer).toBeInTheDocument()
  })
})
