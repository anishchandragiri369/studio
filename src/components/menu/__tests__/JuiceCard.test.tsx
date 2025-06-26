import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import JuiceCard from '@/components/menu/JuiceCard'
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

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode, href: string }) => 
    <a href={href} {...props}>{children}</a>
}))

const mockJuice = {
  id: '1',
  name: 'Orange Juice',
  flavor: 'Orange',
  price: 5.99,
  description: 'Fresh orange juice',
  category: 'Citrus',
  image: '/images/orange-juice.jpg',
  stockQuantity: 10,
  availability: 'In Stock' as const
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  )
}

describe('JuiceCard', () => {  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders juice card with basic information', () => {
    renderWithProviders(<JuiceCard juice={mockJuice} />)
    expect(screen.getByText('Orange Juice')).toBeInTheDocument()
    expect(screen.getByText('Rs.5.99')).toBeInTheDocument()
  })

  it('displays juice image', () => {
    renderWithProviders(<JuiceCard juice={mockJuice} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('shows add to cart button', () => {
    renderWithProviders(<JuiceCard juice={mockJuice} />)
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })

  it('has proper glassmorphism styling', () => {
    const { container } = renderWithProviders(<JuiceCard juice={mockJuice} />)
    const card = container.querySelector('.glass-card')
    expect(card).toBeInTheDocument()
  })

  it('handles add to cart click', () => {
    renderWithProviders(<JuiceCard juice={mockJuice} />)
    const addButton = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(addButton)
    // The cart should update (test would need to verify cart state)
  })

  it('displays juice description when expanded', () => {
    renderWithProviders(<JuiceCard juice={mockJuice} />)
    expect(screen.getByText('Fresh orange juice') || screen.getByText(/description/i)).toBeInTheDocument()
  })
})
