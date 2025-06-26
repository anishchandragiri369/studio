import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PrivacyPolicyPage from '@/app/privacy-policy/page'
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

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  )
}

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders the privacy policy page', () => {
    renderWithProviders(<PrivacyPolicyPage />)
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })
  it('displays privacy policy content', () => {
    renderWithProviders(<PrivacyPolicyPage />)
    expect(screen.getByText('Your privacy is important to us. Learn how we collect, use, and protect your information.')).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    const { container } = renderWithProviders(<PrivacyPolicyPage />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
