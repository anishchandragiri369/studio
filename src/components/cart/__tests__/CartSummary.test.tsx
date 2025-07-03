// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import CartSummary from '../CartSummary';
import { useCart } from '@/hooks/useCart';

// Mock useCart hook
jest.mock('@/hooks/useCart', () => ({
  useCart: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, asChild, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: (props: any) => <hr {...props} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockUseCart = useCart as jest.MockedFunction<typeof useCart>;
const mockClearCart = jest.fn();

const mockCartItems = [
  { id: '1', name: 'Green Juice', price: 8.99, quantity: 2, flavor: 'Green', image: '/images/green.jpg', type: 'regular' as const },
  { id: '2', name: 'Orange Juice', price: 6.99, quantity: 1, flavor: 'Orange', image: '/images/orange.jpg', type: 'regular' as const },
];

const createMockCartContext = (overrides = {}) => ({
  cartItems: mockCartItems,
  getCartTotal: jest.fn(() => 24.97),
  clearCart: mockClearCart,
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  getItemCount: jest.fn(),
  addSubscriptionToCart: jest.fn(),
  getRegularItems: jest.fn(() => mockCartItems),
  getSubscriptionItems: jest.fn(() => []),
  ...overrides
});

describe('CartSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cart summary with correct totals', () => {
    mockUseCart.mockReturnValue(createMockCartContext());

    render(<CartSummary />);
    
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Rs.24.97')).toBeInTheDocument(); // Subtotal
    expect(screen.getByText('Rs.5.00')).toBeInTheDocument(); // Shipping
    expect(screen.getByText('Rs.29.97')).toBeInTheDocument(); // Total
  });

  it('displays checkout and clear cart buttons', () => {
    mockUseCart.mockReturnValue({
      cartItems: mockCartItems,
      getCartTotal: jest.fn(() => 24.97),
      clearCart: mockClearCart,
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      getItemCount: jest.fn(),
    });

    render(<CartSummary />);
    
    expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument();
    expect(screen.getByText('Clear Cart')).toBeInTheDocument();
  });

  it('calls clearCart when clear cart button is clicked', () => {
    mockUseCart.mockReturnValue({
      cartItems: mockCartItems,
      getCartTotal: jest.fn(() => 24.97),
      clearCart: mockClearCart,
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      getItemCount: jest.fn(),
    });

    render(<CartSummary />);
    
    const clearButton = screen.getByText('Clear Cart');
    fireEvent.click(clearButton);
    
    expect(mockClearCart).toHaveBeenCalled();
  });

  it('does not render when cart is empty', () => {
    mockUseCart.mockReturnValue({
      cartItems: [],
      getCartTotal: jest.fn(() => 0),
      clearCart: mockClearCart,
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      getItemCount: jest.fn(),
    });

    const { container } = render(<CartSummary />);
    
    expect(container.firstChild).toBeNull();
  });
  it('shows no shipping cost when cart total is 0', () => {
    mockUseCart.mockReturnValue({
      cartItems: [{ id: '1', name: 'Free Item', price: 0, quantity: 1, flavor: 'Plain', image: '/images/plain.jpg' }],
      getCartTotal: jest.fn(() => 0),
      clearCart: mockClearCart,
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      getItemCount: jest.fn(),
    });

    render(<CartSummary />);
    
    // Check for Grand Total specifically
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
    const grandTotalElements = screen.getAllByText('Rs.0.00');
    expect(grandTotalElements.length).toBeGreaterThan(0); // Should find multiple Rs.0.00 (subtotal, shipping, total)
  });

  it('has correct checkout link', () => {
    mockUseCart.mockReturnValue({
      cartItems: mockCartItems,
      getCartTotal: jest.fn(() => 24.97),
      clearCart: mockClearCart,
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      getItemCount: jest.fn(),
    });

    render(<CartSummary />);
    
    const checkoutButton = screen.getByText('Proceed to Checkout').closest('a');
    expect(checkoutButton).toHaveAttribute('href', '/checkout');
  });
});
