import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import MenuPage from '@/app/menu/page'
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

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null)
  })
}))

// Mock Supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: null,
  isSupabaseConfigured: false
}))

// Mock constants
jest.mock('@/lib/constants', () => ({
  JUICES: [],
  TRADITIONAL_JUICE_CATEGORIES: ['All', 'Citrus', 'Berry', 'Green']
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  )
}

describe('MenuPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders the menu page content', () => {
    renderWithProviders(<MenuPage />)
    expect(screen.getByText('Our Fresh Elixrs')).toBeInTheDocument()
    expect(screen.getByText('Discover a world of flavor with our handcrafted elixirs, made from the freshest ingredients')).toBeInTheDocument()
  })

  it('shows empty state when no juices available', () => {
    renderWithProviders(<MenuPage />)
    expect(screen.getByText('No elixrs found')).toBeInTheDocument()
  })

  it('displays floating bubbles decorations', () => {
    const { container } = renderWithProviders(<MenuPage />)
    const floatingBubbles = container.querySelectorAll('[class*="animate-float-ultra"]')
    expect(floatingBubbles.length).toBeGreaterThan(0)
  })

  it('has proper glassmorphism styling', () => {
    const { container } = renderWithProviders(<MenuPage />)
    const glassElements = container.querySelectorAll('.glass-card')
    expect(glassElements.length).toBeGreaterThan(0)
  })
})
