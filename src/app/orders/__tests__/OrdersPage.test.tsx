import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import OrdersPage from '../page';
import { useAuth } from '@/context/AuthContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock supabase client with successful response
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({
                data: [
                  {
                    id: '1',
                    created_at: '2024-12-01T10:00:00Z',
                    status: 'payment_success',
                    total_amount: 299,
                    order_type: 'regular',
                    items: [{ name: 'Fresh Orange Juice', quantity: 2, price: 149.50 }],
                    shipping_address: '123 Test St, Test City'
                  }
                ],
                error: null,
              })),
            })),
          })),
        })),
      })),
    })),
  },
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
  CardDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  CardFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: (props: any) => <hr {...props} />,
}));

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  AlertTitle: ({ children, ...props }: any) => <h4 {...props}>{children}</h4>,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('OrdersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    mockUseAuth.mockReturnValue({
      user: {
        id: 'user123',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z'
      } as any,
      loading: false,
      logOut: jest.fn(),
      isSupabaseConfigured: true,
      isAdmin: false,
      signUp: jest.fn(),
      logIn: jest.fn(),
      sendPasswordReset: jest.fn(),
    });
  });

  it('renders orders page with title when authenticated', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
    });
  });

  it('shows guest order form when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      logOut: jest.fn(),
      isSupabaseConfigured: true,
      isAdmin: false,
      signUp: jest.fn(),
      logIn: jest.fn(),
      sendPasswordReset: jest.fn(),
    });

    render(<OrdersPage />);

    expect(screen.getByText('View Your Orders')).toBeInTheDocument();
    expect(screen.getByText('Enter your email address to view your order history, or log in for a personalized experience.')).toBeInTheDocument();
  });

  it('shows loading state while authentication is in progress', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      logOut: jest.fn(),
      isSupabaseConfigured: true,
      isAdmin: false,
      signUp: jest.fn(),
      logIn: jest.fn(),
      sendPasswordReset: jest.fn(),
    });

    render(<OrdersPage />);

    // Should not redirect while loading
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders orders content when user is authenticated', async () => {
    render(<OrdersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
    });
  });
});
