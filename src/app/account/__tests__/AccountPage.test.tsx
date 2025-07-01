import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AccountPage from '../page';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/useCart';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock useCart hook
jest.mock('@/hooks/useCart', () => ({
  useCart: jest.fn(),
}));

// Mock supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => ({
            order: jest.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  },
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ asChild, children, ...props }: any) => {
    if (asChild) {
      return React.cloneElement(children, props);
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

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AvatarFallback: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  AvatarImage: ({ children, ...props }: any) => <img {...props} alt="avatar" />,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: (props: any) => <hr {...props} />,
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
const mockUseCart = useCart as jest.MockedFunction<typeof useCart>;

describe('AccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });    mockUseAuth.mockReturnValue({
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
    });    mockUseCart.mockReturnValue({
      cartItems: [],
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getCartTotal: jest.fn(() => 0),
      getItemCount: jest.fn(() => 0),
      addSubscriptionToCart: jest.fn(),
      getRegularItems: jest.fn(() => []),
      getSubscriptionItems: jest.fn(() => []),
    });
  });

  it('renders account page with user info when authenticated', async () => {
    render(<AccountPage />);
    
    await waitFor(() => {
      expect(screen.getByText('My Account')).toBeInTheDocument();
    });
  });
  it('redirects to login when user is not authenticated', () => {
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

    render(<AccountPage />);

    expect(mockPush).toHaveBeenCalledWith('/login?redirect=/account');
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

    render(<AccountPage />);

    // Should not redirect while loading
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders account content when user is authenticated', async () => {
    render(<AccountPage />);
    
    await waitFor(() => {
      expect(screen.getByText('My Account')).toBeInTheDocument();
    });
  });
});
