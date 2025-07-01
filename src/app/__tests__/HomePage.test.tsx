import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomePage from '@/app/page'
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

// Mock the components that HomePage uses
jest.mock('@/components/menu/JuiceCard', () => {
  return function MockJuiceCard({ juice }: { juice: any }) {
    return <div data-testid="juice-card">{juice.name}</div>
  }
})

jest.mock('@/components/recommendations/JuiceRecommenderClient', () => {
  return function MockJuiceRecommenderClient() {
    return <div data-testid="juice-recommender">Juice Recommender</div>
  }
})

jest.mock('@/components/subscriptions/SubscriptionOptionCard', () => {
  return function MockSubscriptionOptionCard({ plan }: { plan: any }) {
    return <div data-testid="subscription-card">{plan.name}</div>
  }
})

jest.mock('@/components/categories/CategoryScroller', () => {
  return function MockCategoryScroller() {
    return <div data-testid="category-scroller">Categories</div>
  }
})

jest.mock('@/components/shared/WhatsAppLink', () => {
  return function MockWhatsAppLink({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div data-testid="whatsapp-link" className={className}>{children}</div>
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    // Mock Next.js Image component
    jest.mock('next/image', () => ({
      __esModule: true,
      default: (props: any) => <img {...props} />,
    }))
  })

  it('renders the main hero section', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByText('Taste the Freshness')).toBeInTheDocument()
    expect(screen.getByText(/Experience the ultimate fusion of taste and wellness/)).toBeInTheDocument()
  })

  it('displays CTA buttons', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByRole('link', { name: /explore elixrs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /premium plans/i })).toBeInTheDocument()
  })

  it('shows social proof elements', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByText('4.9/5')).toBeInTheDocument()
    expect(screen.getByText('rating')).toBeInTheDocument()
    expect(screen.getByText('15,000+')).toBeInTheDocument()
    expect(screen.getByText('happy customers')).toBeInTheDocument()
  })

  it('displays quick actions bar', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByTestId('whatsapp-link')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp Order')).toBeInTheDocument()
    expect(screen.getByText('Follow Us')).toBeInTheDocument()
    expect(screen.getByText('Free Delivery Above ₹500')).toBeInTheDocument()
  })

  it('renders categories section', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByText('Shop by Category')).toBeInTheDocument()
    expect(screen.getByText('Find the perfect juice for your wellness journey')).toBeInTheDocument()
    expect(screen.getByTestId('category-scroller')).toBeInTheDocument()
  })

  it('displays featured products section', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByText('Zero Sugar Fruit Juice From ₹120')).toBeInTheDocument()
    expect(screen.getByText(/Our most popular cold-pressed juices/)).toBeInTheDocument()
    
    // Should render multiple juice cards - HomePage renders all juice cards twice
    const juiceCards = screen.getAllByTestId('juice-card')
    expect(juiceCards).toHaveLength(16) // 8 juices rendered twice
  })

  it('shows quality features section', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByText('High Standard Quality And Taste')).toBeInTheDocument()
    expect(screen.getByText(/We follow hygienic and natural processes/)).toBeInTheDocument()
  })
  it('renders AI recommendations section', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByText('Personalized Just for You')).toBeInTheDocument()
    expect(screen.getByTestId('juice-recommender')).toBeInTheDocument()
  })
  it('displays subscription plans section', () => {
    renderWithProviders(<HomePage />)
    
    expect(screen.getByText('Our Subscription Plans')).toBeInTheDocument()
    expect(screen.getByText(/our subscription plans are designed to bring you the best of health/i)).toBeInTheDocument()
    
    // Should render subscription cards
    const subscriptionCards = screen.getAllByTestId('subscription-card')
    expect(subscriptionCards.length).toBeGreaterThan(0)
  })
})
