import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Navbar from '@/components/shared/Navbar'
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

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('renders the navbar', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByAltText('Elixr Logo')).toBeInTheDocument()
  })
  it('displays navigation links', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })
  it('shows cart icon', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByLabelText('Shopping Cart')).toBeInTheDocument()
  })

  it('has mobile menu toggle', () => {
    renderWithProviders(<Navbar />)
    const mobileToggle = screen.getByRole('button', { name: /menu/i }) || screen.getByLabelText(/menu/i)
    expect(mobileToggle).toBeInTheDocument()
  })

  it('displays category dropdown', () => {
    renderWithProviders(<Navbar />)
    expect(screen.getByText(/categories/i) || screen.getByText(/juice/i)).toBeInTheDocument()
  })
  it('has proper glassmorphism styling', () => {
    const { container } = renderWithProviders(<Navbar />)
    const navbar = container.querySelector('header')
    expect(navbar).toHaveClass('glass-nav')
  })
})
