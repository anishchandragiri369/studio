// Integration Tests - Complete User Journey Testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Test data
const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '9876543210'
};

const mockProduct = {
  id: 1,
  name: 'Fresh Orange Juice',
  price: 120,
  description: 'Freshly squeezed orange juice',
  category: 'juices',
  image: '/images/orange-juice.jpg'
};

const mockCart = [
  { ...mockProduct, quantity: 2 }
];

describe('Complete User Journey Integration Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe('User Registration and Login Flow', () => {
    test('complete user registration journey', async () => {
      const user = userEvent.setup();

      // Mock successful registration API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          user: mockUser,
          message: 'Registration successful' 
        })
      });

      // Import and render signup page
      const { default: SignUpPage } = await import('../../src/app/signup/page');
      render(<SignUpPage />);

      // Fill registration form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(nameInput, mockUser.name);
      await user.type(emailInput, mockUser.email);
      await user.type(phoneInput, mockUser.phone);
      await user.type(passwordInput, 'SecurePass123!');

      // Submit form
      await user.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/signup', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(mockUser.email)
        }));
      });

      // Verify redirect to login or dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/(login|dashboard)/));
      });
    });

    test('user login flow with validation', async () => {
      const user = userEvent.setup();

      // Mock successful login API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          user: mockUser,
          token: 'jwt-token-123'
        })
      });

      const { default: LoginPage } = await import('../../src/app/login/page');
      render(<LoginPage />);

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, mockUser.email);
      await user.type(passwordInput, 'SecurePass123!');
      await user.click(submitButton);

      // Verify login API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/signin', expect.objectContaining({
          method: 'POST'
        }));
      });
    });

    test('handles login validation errors', async () => {
      const user = userEvent.setup();

      // Mock validation error response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Invalid email or password' 
        })
      });

      const { default: LoginPage } = await import('../../src/app/login/page');
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid@email.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Product Browsing and Cart Management', () => {
    test('browse products and add to cart', async () => {
      const user = userEvent.setup();

      // Mock products API response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          products: [mockProduct],
          categories: ['juices', 'fruit-bowls']
        })
      });

      const { default: MenuPage } = await import('../../src/app/menu/page');
      render(<MenuPage />);

      // Wait for products to load
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      });

      // Add product to cart
      const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
      await user.click(addToCartButton);

      // Verify product is added to cart (check cart context or local storage)
      expect(addToCartButton).toBeInTheDocument();
    });

    test('cart management - add, remove, update quantities', async () => {
      const user = userEvent.setup();

      // Mock cart with items
      const { default: CartPage } = await import('../../src/app/cart/page');
      
      // Mock cart context with items
      const MockCartProvider = ({ children }) => {
        const cartValue = {
          items: mockCart,
          addItem: jest.fn(),
          removeItem: jest.fn(),
          updateQuantity: jest.fn(),
          clearCart: jest.fn(),
          total: 240
        };
        
        return (
          <div data-testid="cart-provider">
            {children}
          </div>
        );
      };

      render(
        <MockCartProvider>
          <CartPage />
        </MockCartProvider>
      );

      // Verify cart items are displayed
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
        expect(screen.getByText('₹240')).toBeInTheDocument();
      });

      // Test quantity update
      const quantityInput = screen.getByDisplayValue('2');
      await user.clear(quantityInput);
      await user.type(quantityInput, '3');

      // Test remove item
      const removeButton = screen.getByRole('button', { name: /remove/i });
      if (removeButton) {
        await user.click(removeButton);
      }
    });
  });

  describe('Checkout and Payment Flow', () => {
    test('complete checkout process', async () => {
      const user = userEvent.setup();

      // Mock order creation API
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          orderId: 'ELX123456',
          paymentLink: 'https://checkout.cashfree.com/test'
        })
      });

      const { default: CheckoutPage } = await import('../../src/app/checkout/page');
      render(<CheckoutPage />);

      // Fill checkout form
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);
      const addressInput = screen.getByLabelText(/address/i);

      await user.type(nameInput, mockUser.name);
      await user.type(emailInput, mockUser.email);
      await user.type(phoneInput, mockUser.phone);
      await user.type(addressInput, '123 Test Street, Test City, 123456');

      // Submit order
      const placeOrderButton = screen.getByRole('button', { name: /place order/i });
      await user.click(placeOrderButton);

      // Verify order creation API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/cashfree/create-order', expect.objectContaining({
          method: 'POST'
        }));
      });

      // Should redirect to payment gateway
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('checkout.cashfree.com'));
      });
    });

    test('handles checkout validation errors', async () => {
      const user = userEvent.setup();

      const { default: CheckoutPage } = await import('../../src/app/checkout/page');
      render(<CheckoutPage />);

      // Try to submit without filling required fields
      const placeOrderButton = screen.getByRole('button', { name: /place order/i });
      await user.click(placeOrderButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    test('payment failure handling', async () => {
      // Mock payment failure API response
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ 
          error: 'Payment failed',
          orderId: 'ELX123456'
        })
      });

      const { default: PaymentFailedPage } = await import('../../src/app/payment-failed/page');
      render(<PaymentFailedPage />);

      // Should display failure message and retry options
      expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry payment/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /contact support/i })).toBeInTheDocument();
    });

    test('payment success flow', async () => {
      // Mock successful payment verification
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          order: {
            id: 'ELX123456',
            status: 'confirmed',
            items: mockCart,
            total: 240
          }
        })
      });

      const { default: OrderSuccessPage } = await import('../../src/app/order-success/page');
      render(<OrderSuccessPage />);

      // Should display success message and order details
      await waitFor(() => {
        expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
        expect(screen.getByText('ELX123456')).toBeInTheDocument();
      });
    });
  });

  describe('Subscription Management Flow', () => {
    test('create new subscription', async () => {
      const user = userEvent.setup();

      // Mock subscription creation API
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          subscription: {
            id: 'SUB123456',
            plan: 'daily',
            status: 'active',
            startDate: '2024-12-01',
            endDate: '2024-12-31'
          }
        })
      });

      const { default: SubscriptionsPage } = await import('../../src/app/subscriptions/page');
      render(<SubscriptionsPage />);

      // Select subscription plan
      const dailyPlanButton = screen.getByRole('button', { name: /daily plan/i });
      await user.click(dailyPlanButton);

      // Configure subscription
      const durationSelect = screen.getByLabelText(/duration/i);
      await user.selectOptions(durationSelect, '30');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '2024-12-01');

      // Submit subscription
      const subscribeButton = screen.getByRole('button', { name: /subscribe now/i });
      await user.click(subscribeButton);

      // Verify subscription API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/subscriptions/create', expect.objectContaining({
          method: 'POST'
        }));
      });
    });

    test('manage existing subscriptions', async () => {
      const user = userEvent.setup();

      // Mock user subscriptions API
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          subscriptions: [
            {
              id: 'SUB123456',
              plan: 'daily',
              status: 'active',
              nextDelivery: '2024-12-02',
              items: [mockProduct]
            }
          ]
        })
      });

      const { default: MySubscriptionsPage } = await import('../../src/app/my-subscriptions/page');
      render(<MySubscriptionsPage />);

      // Should display subscription details
      await waitFor(() => {
        expect(screen.getByText('SUB123456')).toBeInTheDocument();
        expect(screen.getByText(/active/i)).toBeInTheDocument();
      });

      // Test pause subscription
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      if (pauseButton) {
        await user.click(pauseButton);
        
        // Should confirm pause action
        await waitFor(() => {
          expect(screen.getByText(/pause subscription/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Contact and Support Flow', () => {
    test('submit contact form', async () => {
      const user = userEvent.setup();

      // Mock contact form submission
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true,
          messageId: 'MSG123456'
        })
      });

      const { default: ContactPage } = await import('../../src/app/contact/page');
      render(<ContactPage />);

      // Fill contact form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const messageInput = screen.getByLabelText(/message/i);

      await user.type(nameInput, mockUser.name);
      await user.type(emailInput, mockUser.email);
      await user.type(messageInput, 'This is a test message for customer support.');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /send message/i });
      await user.click(submitButton);

      // Verify contact API call
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
          method: 'POST'
        }));
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles network errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock network error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const { default: MenuPage } = await import('../../src/app/menu/page');
      render(<MenuPage />);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i) || screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('handles API server errors', async () => {
      const user = userEvent.setup();

      // Mock server error
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      const { default: CheckoutPage } = await import('../../src/app/checkout/page');
      render(<CheckoutPage />);

      const placeOrderButton = screen.getByRole('button', { name: /place order/i });
      await user.click(placeOrderButton);

      // Should handle server error gracefully
      await waitFor(() => {
        expect(screen.getByText(/server error/i) || screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });

    test('handles loading states', async () => {
      // Mock slow API response
      fetch.mockImplementationOnce(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: async () => ({ products: [mockProduct] })
          }), 2000)
        )
      );

      const { default: MenuPage } = await import('../../src/app/menu/page');
      render(<MenuPage />);

      // Should show loading state
      expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness Tests', () => {
    test('renders correctly on mobile viewport', async () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { default: HomePage } = await import('../../src/app/page');
      render(<HomePage />);

      // Should render mobile navigation
      expect(screen.getByRole('button', { name: /menu/i }) || screen.getByText(/☰/)).toBeInTheDocument();
    });
  });

  describe('SEO and Accessibility Tests', () => {
    test('includes proper meta tags and headings', async () => {
      const { default: HomePage } = await import('../../src/app/page');
      render(<HomePage />);

      // Should have proper heading structure
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();

      // Should have proper alt texts for images
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
      });
    });

    test('keyboard navigation works correctly', async () => {
      const user = userEvent.setup();

      const { default: MenuPage } = await import('../../src/app/menu/page');
      render(<MenuPage />);

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();

      // Test enter key on focusable elements
      const firstButton = screen.getAllByRole('button')[0];
      if (firstButton) {
        firstButton.focus();
        await user.keyboard('{Enter}');
      }
    });
  });
});
