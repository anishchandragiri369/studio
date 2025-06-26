import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '@/app/login/page'
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

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders the login page', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
  })

  it('displays email and password fields', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it('has a login button', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /log in/i }) || screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })
  it('displays login form elements', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('Welcome Back!')).toBeInTheDocument()
    expect(screen.getByText('Log in to your Elixr account.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('has proper card styling', () => {
    const { container } = renderWithProviders(<LoginPage />)
    const cardElements = container.querySelectorAll('.shadow-xl')
    expect(cardElements.length).toBeGreaterThan(0)
  })

  it('shows forgot password link', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
  })

  it('shows signup link', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText(/sign up/i) || screen.getByText(/create account/i)).toBeInTheDocument()
  })
})
