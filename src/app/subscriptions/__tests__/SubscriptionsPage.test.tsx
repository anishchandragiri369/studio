import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SubscriptionsPage from '@/app/subscriptions/page'
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

// Mock subscription components
jest.mock('@/components/subscriptions/SubscriptionOptionCard', () => {
  return function MockSubscriptionOptionCard({ plan }: { plan: any }) {
    return <div data-testid="subscription-card">{plan?.name || 'Subscription Plan'}</div>
  }
})

jest.mock('@/components/subscriptions/AISubscriptionRecommender', () => {
  return function MockAISubscriptionRecommender() {
    return <div data-testid="ai-subscription-recommender">AI Recommender</div>
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

describe('SubscriptionsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders the subscriptions page', () => {
    renderWithProviders(<SubscriptionsPage />)
    expect(screen.getByText('Our Subscription Plans')).toBeInTheDocument()
  })

  it('displays floating bubbles decorations', () => {
    const { container } = renderWithProviders(<SubscriptionsPage />)
    const floatingBubbles = container.querySelectorAll('[class*="animate-float"]')
    expect(floatingBubbles.length).toBeGreaterThan(0)
  })

  it('has proper glassmorphism styling', () => {
    const { container } = renderWithProviders(<SubscriptionsPage />)
    const glassElements = container.querySelectorAll('.glass-card')
    expect(glassElements.length).toBeGreaterThan(0)
  })
  it('shows subscription benefits', () => {
    renderWithProviders(<SubscriptionsPage />)
    expect(screen.getByText('Health Benefits')).toBeInTheDocument()
  })
})
