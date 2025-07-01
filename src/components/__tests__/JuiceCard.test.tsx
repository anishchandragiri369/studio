import { render, screen } from '@testing-library/react'
import JuiceCard from '@/components/menu/JuiceCard'
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

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { fill, priority, unoptimized, ...imgProps } = props;
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...imgProps} />
  },
}))

// Mock CartContext
jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    getItemQuantity: jest.fn(() => 0),
    cartItems: [],
    getCartTotal: jest.fn(() => 0),
    clearCart: jest.fn(),
  }),
}))

// Mock Supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}))

const mockJuice = {
  id: '1',
  name: 'Test Juice',
  flavor: 'Test Flavor',
  price: 100,
  image: '/test-image.jpg',
  description: 'Test description',
  category: 'Test Category',
  tags: ['test'],
  availability: 'In Stock' as const,
  stockQuantity: 10,
  dataAiHint: 'test-juice',
}

describe('JuiceCard', () => {
  it('renders juice card with basic information', () => {
    render(<JuiceCard juice={mockJuice} />)
    
    expect(screen.getByText('Test Juice')).toBeInTheDocument()
    expect(screen.getByText('Test Flavor')).toBeInTheDocument()
    expect(screen.getByText('Rs.100.00')).toBeInTheDocument()
  })
})