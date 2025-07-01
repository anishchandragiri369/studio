import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import OrderSuccessPage from '../page';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    if (asChild) {
      return <>{children}</>;
    }
    return <button {...props}>{children}</button>;
  },
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

// Mock Supabase with successful session
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ 
            data: [{
              id: '1',
              status: 'completed',
              total_amount: 299,
              payment_id: 'pay_123',
              user_id: 'test-user',
              created_at: '2024-12-01T10:00:00Z'
            }], 
            error: null 
          }))
        }))
      }))
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ 
        data: { 
          session: { 
            user: { 
              id: 'test-user',
              email: 'test@example.com' 
            },
            access_token: 'valid-token'
          } 
        }, 
        error: null 
      })),
      refreshSession: jest.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      }))
    }
  }
}));

// Mock Auth Context
jest.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => children,
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    loading: false,
    isSupabaseConfigured: true
  })
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <CartProvider>
      {component}
    </CartProvider>
  );
};

describe('OrderSuccessPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders order success page with confirmation message', async () => {
    renderWithProviders(<OrderSuccessPage />);
    
    // Fast-forward the timer to trigger session restoration
    jest.advanceTimersByTime(1000);
    
    // Wait for loading to complete
    await screen.findByText('Order Successful!');
    
    expect(screen.getByText('Order Successful!')).toBeInTheDocument();
    expect(screen.getByText('Thank you for your purchase! Your order has been confirmed and is being processed.')).toBeInTheDocument();
  });

  it('displays return home and view orders buttons', async () => {
    renderWithProviders(<OrderSuccessPage />);
    
    // Fast-forward the timer to trigger session restoration
    jest.advanceTimersByTime(1000);
    
    // Wait for loading to complete
    await screen.findByText('Order Successful!');
    
    expect(screen.getByText('Return Home')).toBeInTheDocument();
    expect(screen.getByText('View Orders')).toBeInTheDocument();
  });

  it('renders confirmation icon and success message', async () => {
    renderWithProviders(<OrderSuccessPage />);
    
    // Fast-forward the timer to trigger session restoration
    jest.advanceTimersByTime(1000);
    
    // Wait for loading to complete
    await screen.findByText('Order Successful!');
    
    expect(screen.getByText('Order Successful!')).toBeInTheDocument();
    expect(screen.getByText(/We'll send you an email confirmation/)).toBeInTheDocument();
  });
});
