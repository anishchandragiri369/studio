import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import OrderSuccessPage from '../page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('OrderSuccessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
  });

  it('renders order success page with confirmation message', () => {
    render(<OrderSuccessPage />);
    
    expect(screen.getByText('Order Successful!')).toBeInTheDocument();
    expect(screen.getByText('Thank you for your purchase! Your order has been confirmed and is being processed.')).toBeInTheDocument();
  });

  it('displays return home and view orders buttons', () => {
    render(<OrderSuccessPage />);
    
    expect(screen.getByText('Return Home')).toBeInTheDocument();
    expect(screen.getByText('View Orders')).toBeInTheDocument();
  });

  it('renders confirmation icon and success message', () => {
    render(<OrderSuccessPage />);
    
    expect(screen.getByText('Order Successful!')).toBeInTheDocument();
    expect(screen.getByText(/We'll send you an email confirmation/)).toBeInTheDocument();
  });
});
