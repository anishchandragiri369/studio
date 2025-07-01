import { render, screen, fireEvent } from '@testing-library/react';
import CartItem from '../CartItem';
import { useCart } from '@/hooks/useCart';
import type { UnifiedCartItem } from '@/components/cart/CartItem';

// Mock useCart hook
jest.mock('@/hooks/useCart', () => ({
  useCart: jest.fn(),
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
}));

// Mock Next.js components
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, role, ...props }: any) => <img src={src} alt={alt} role={role} {...props} />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockUseCart = useCart as jest.MockedFunction<typeof useCart>;
const mockUpdateQuantity = jest.fn();
const mockRemoveFromCart = jest.fn();

type CartItemType = UnifiedCartItem;

const mockCartItem: CartItemType = {
  id: 'juice-1',
  name: 'Green Detox Juice',
  price: 8.99,
  image: '/images/green-detox.jpg',
  quantity: 2,
  flavor: 'Original',
  type: 'regular',
};

const mockUseCartReturnValue = {
  cartItems: [mockCartItem],
  addToCart: jest.fn(),
  removeFromCart: jest.fn(),
  updateQuantity: jest.fn(),
  clearCart: jest.fn(),
  getCartTotal: jest.fn(),
  getItemCount: jest.fn(),
  addSubscriptionToCart: jest.fn(),
  getRegularItems: jest.fn(),
  getSubscriptionItems: jest.fn(),
};

mockUseCart.mockReturnValue(mockUseCartReturnValue);

describe('CartItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCart.mockReturnValue({
      cartItems: [mockCartItem],
      addToCart: jest.fn(),
      removeFromCart: mockRemoveFromCart,
      updateQuantity: mockUpdateQuantity,
      clearCart: jest.fn(),
      getCartTotal: jest.fn(),
      getItemCount: jest.fn(),
      addSubscriptionToCart: jest.fn(), // Added
      getRegularItems: jest.fn(),       // Added
      getSubscriptionItems: jest.fn(), // Added
    });
  });
  it('renders cart item with correct information', () => {
    render(<CartItem item={mockCartItem} />);
    
    expect(screen.getByText('Green Detox Juice')).toBeInTheDocument();
    expect(screen.getByText(/Rs\.\s*8\.99/)).toBeInTheDocument(); // Flexible match for "Rs. 8.99"
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
  });

  it('displays the item image with correct alt text', () => {
    render(<CartItem item={mockCartItem} />);
    
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/images/green-detox.jpg');
    expect(image).toHaveAttribute('alt', 'Green Detox Juice');
  });

  it('calls updateQuantity when quantity is changed', () => {
    render(<CartItem item={mockCartItem} />);
    
    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '3' } });
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith('juice-1', 3);
  });
  it('enforces minimum quantity of 1 when input changes', () => {
    render(<CartItem item={mockCartItem} />);
    
    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '0' } });
    
    // The component actually prevents going below 1, so updateQuantity should be called with 1
    expect(mockUpdateQuantity).toHaveBeenCalledWith('juice-1', 1);
  });

  it('increments quantity when plus button is clicked', () => {
    render(<CartItem item={mockCartItem} />);
    
    const plusButton = screen.getByLabelText('Increase quantity');
    fireEvent.click(plusButton);
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith('juice-1', 3);
  });

  it('decrements quantity when minus button is clicked', () => {
    render(<CartItem item={mockCartItem} />);
    
    const minusButton = screen.getByLabelText('Decrease quantity');
    fireEvent.click(minusButton);
    
    expect(mockUpdateQuantity).toHaveBeenCalledWith('juice-1', 1);
  });
  it('removes item when remove button is clicked', () => {
    render(<CartItem item={mockCartItem} />);
    
    const removeButton = screen.getByLabelText('Remove Green Detox Juice from cart');
    fireEvent.click(removeButton);
    
    expect(mockRemoveFromCart).toHaveBeenCalledWith('juice-1');
  });

  it('has correct link to menu item', () => {
    render(<CartItem item={mockCartItem} />);
    
    const link = screen.getByLabelText('View Green Detox Juice details');
    expect(link).toHaveAttribute('href', '/menu#juice-1');
  });
});
