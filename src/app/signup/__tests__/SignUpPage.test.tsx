import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SignUpPage from '@/app/signup/page'
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

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  )
}

describe('SignUpPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders the signup page', () => {
    renderWithProviders(<SignUpPage />)
    expect(screen.getByText('Create an Account')).toBeInTheDocument()
  })
  it('displays required form fields', () => {
    renderWithProviders(<SignUpPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('has a signup button', () => {
    renderWithProviders(<SignUpPage />)
    expect(screen.getByRole('button', { name: /sign up/i }) || screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })
  it('displays signup form elements', () => {
    renderWithProviders(<SignUpPage />)
    expect(screen.getByText('Create an Account')).toBeInTheDocument()
    expect(screen.getByText('Join Elixr and start your fresh juice journey!')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('has proper card styling', () => {
    const { container } = renderWithProviders(<SignUpPage />)
    const cardElements = container.querySelectorAll('.shadow-xl')
    expect(cardElements.length).toBeGreaterThan(0)
  })

  it('shows login link', () => {
    renderWithProviders(<SignUpPage />)
    expect(screen.getByText('Log in')).toBeInTheDocument()
  })
})
