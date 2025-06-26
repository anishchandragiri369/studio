import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContactPage from '@/app/contact/page'
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

describe('ContactPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the contact page', () => {
    renderWithProviders(<ContactPage />)
    expect(screen.getByText(/contact/i) || screen.getByText(/get in touch/i)).toBeInTheDocument()
  })

  it('displays contact information', () => {
    renderWithProviders(<ContactPage />)
    // Check for phone, email, or address
    const contactInfo = screen.getByText(/@/) || screen.getByText(/\+/) || screen.getByText(/phone/i) || screen.getByText(/email/i)
    expect(contactInfo).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    const { container } = renderWithProviders(<ContactPage />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
