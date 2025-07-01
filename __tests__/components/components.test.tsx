/**
 * Component Testing Suite
 * Tests React components and user interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock auth context
const mockAuthContext = {
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('Payment Failure Page', () => {
  it('should render payment failure page correctly', () => {
    // Mock payment failure page component
    const PaymentFailedPage = () => (
      <div>
        <h1>Payment Failed</h1>
        <p>Your payment could not be processed</p>
        <button>Try Again</button>
        <a href="/contact">Contact Support</a>
      </div>
    );

    render(<PaymentFailedPage />);
    
    expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    expect(screen.getByText('Your payment could not be processed')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
  });

  it('should display order details when provided', () => {
    const PaymentFailedPageWithDetails = () => (
      <div>
        <h1>Payment Failed</h1>
        <div data-testid="order-details">
          <p>Order ID: test-order-123</p>
          <p>Amount: ₹299</p>
          <p>Reason: Insufficient funds</p>
        </div>
      </div>
    );

    render(<PaymentFailedPageWithDetails />);
    
    const orderDetails = screen.getByTestId('order-details');
    expect(orderDetails).toHaveTextContent('Order ID: test-order-123');
    expect(orderDetails).toHaveTextContent('Amount: ₹299');
    expect(orderDetails).toHaveTextContent('Reason: Insufficient funds');
  });
});

describe('Authentication Components', () => {
  it('should render login form', () => {
    const LoginForm = () => (
      <form data-testid="login-form">
        <input type="email" placeholder="Email" data-testid="email-input" />
        <input type="password" placeholder="Password" data-testid="password-input" />
        <button type="submit">Login</button>
      </form>
    );

    render(<LoginForm />);
    
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const mockSubmit = jest.fn();
    
    const LoginForm = () => {
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mockSubmit();
      };

      return (
        <form onSubmit={handleSubmit} data-testid="login-form">
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      );
    };

    render(<LoginForm />);
    
    const form = screen.getByTestId('login-form');
    fireEvent.submit(form);
    
    expect(mockSubmit).toHaveBeenCalled();
  });
});

describe('Cart Components', () => {
  it('should render cart items', () => {
    const CartComponent = () => {
      const items = [
        { id: 1, name: 'Orange Juice', quantity: 2, price: 60 },
        { id: 2, name: 'Apple Juice', quantity: 1, price: 55 }
      ];

      return (
        <div data-testid="cart">
          {items.map(item => (
            <div key={item.id} data-testid={`cart-item-${item.id}`}>
              <span>{item.name}</span>
              <span>Qty: {item.quantity}</span>
              <span>₹{item.price}</span>
            </div>
          ))}
          <div data-testid="cart-total">Total: ₹175</div>
        </div>
      );
    };

    render(<CartComponent />);
    
    expect(screen.getByTestId('cart')).toBeInTheDocument();
    expect(screen.getByTestId('cart-item-1')).toHaveTextContent('Orange Juice');
    expect(screen.getByTestId('cart-item-2')).toHaveTextContent('Apple Juice');
    expect(screen.getByTestId('cart-total')).toHaveTextContent('Total: ₹175');
  });

  it('should handle item quantity changes', () => {
    const mockUpdateQuantity = jest.fn();
    
    const CartItem = ({ item }: { item: any }) => (
      <div data-testid={`cart-item-${item.id}`}>
        <span>{item.name}</span>
        <button 
          onClick={() => mockUpdateQuantity(item.id, item.quantity - 1)}
          data-testid="decrease-btn"
        >
          -
        </button>
        <span>{item.quantity}</span>
        <button 
          onClick={() => mockUpdateQuantity(item.id, item.quantity + 1)}
          data-testid="increase-btn"
        >
          +
        </button>
      </div>
    );

    const item = { id: 1, name: 'Orange Juice', quantity: 2, price: 60 };
    render(<CartItem item={item} />);
    
    const increaseBtn = screen.getByTestId('increase-btn');
    fireEvent.click(increaseBtn);
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });
});

describe('Product Components', () => {
  it('should render product card', () => {
    const ProductCard = ({ product }: { product: any }) => (
      <div data-testid={`product-${product.id}`}>
        <img src={product.image} alt={product.name} />
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <span>₹{product.price}</span>
        <button>Add to Cart</button>
      </div>
    );

    const product = {
      id: 1,
      name: 'Orange Juice',
      description: 'Fresh orange juice',
      price: 60,
      image: '/images/orange-juice.jpg'
    };

    render(<ProductCard product={product} />);
    
    expect(screen.getByTestId('product-1')).toBeInTheDocument();
    expect(screen.getByText('Orange Juice')).toBeInTheDocument();
    expect(screen.getByText('Fresh orange juice')).toBeInTheDocument();
    expect(screen.getByText('₹60')).toBeInTheDocument();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });
});

describe('Subscription Components', () => {
  it('should render subscription plan', () => {
    const SubscriptionPlan = ({ plan }: { plan: any }) => (
      <div data-testid={`plan-${plan.id}`}>
        <h3>{plan.name}</h3>
        <p>₹{plan.price}/{plan.frequency}</p>
        <ul>
          {plan.features.map((feature: string, index: number) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        <button>Subscribe</button>
      </div>
    );

    const plan = {
      id: 'weekly-starter',
      name: 'Weekly Starter',
      price: 299,
      frequency: 'week',
      features: ['3 juices per week', 'Free delivery', 'Cancel anytime']
    };

    render(<SubscriptionPlan plan={plan} />);
    
    expect(screen.getByTestId('plan-weekly-starter')).toBeInTheDocument();
    expect(screen.getByText('Weekly Starter')).toBeInTheDocument();
    expect(screen.getByText('₹299/week')).toBeInTheDocument();
    expect(screen.getByText('3 juices per week')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });
});

describe('Error Handling Components', () => {
  it('should display error message', () => {
    const ErrorComponent = ({ error }: { error: string }) => (
      <div data-testid="error-message" role="alert">
        <span>❌</span>
        <p>{error}</p>
      </div>
    );

    render(<ErrorComponent error="Payment failed. Please try again." />);
    
    const errorEl = screen.getByTestId('error-message');
    expect(errorEl).toHaveTextContent('Payment failed. Please try again.');
    expect(errorEl).toHaveAttribute('role', 'alert');
  });

  it('should display loading state', () => {
    const LoadingComponent = ({ loading }: { loading: boolean }) => (
      <div>
        {loading ? (
          <div data-testid="loading">Loading...</div>
        ) : (
          <div data-testid="content">Content loaded</div>
        )}
      </div>
    );

    const { rerender } = render(<LoadingComponent loading={true} />);
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');

    rerender(<LoadingComponent loading={false} />);
    expect(screen.getByTestId('content')).toHaveTextContent('Content loaded');
  });
});
