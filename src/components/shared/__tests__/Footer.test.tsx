import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Footer from '@/components/shared/Footer'
import React from 'react'

// Mock Next.js components
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode, href: string }) => 
    <a href={href} {...props}>{children}</a>
}))

describe('Footer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the footer', () => {
    render(<Footer />)
    expect(screen.getByText(/elixr/i) || screen.getByText(/©/)).toBeInTheDocument()
  })

  it('displays footer links', () => {
    render(<Footer />)
    expect(screen.getByText(/privacy/i) || screen.getByText(/policy/i)).toBeInTheDocument()
  })
  it('shows social media links', () => {
    render(<Footer />)
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
  })

  it('displays copyright information', () => {
    render(<Footer />)
    expect(screen.getByText(/©/) || screen.getByText(/copyright/i) || screen.getByText(/2024/)).toBeInTheDocument()
  })

  it('has proper layout structure', () => {
    const { container } = render(<Footer />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
