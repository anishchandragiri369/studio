// Cart utility functions
export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

export interface FormattedCartItem extends CartItem {
  total: number;
}

// Format cart items with totals
export function formatCartItems(items: CartItem[]): FormattedCartItem[] {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => ({
    ...item,
    total: item.price * item.quantity
  }));
}

// Calculate cart total
export function calculateCartTotal(
  items: CartItem[] | null | undefined, 
  options: { includeTax?: boolean; includeDelivery?: boolean } = {}
): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  let total = subtotal;
  
  if (options.includeTax) {
    total += subtotal * 0.18; // 18% GST
  }
  
  if (options.includeDelivery) {
    total += 50; // Delivery charge
  }
  
  return Math.round(total);
}

// Validate order data
export function validateOrderData(orderData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!orderData) {
    errors.push('Order data is required');
    return { isValid: false, errors };
  }
  
  // Check items
  if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  }
  
  // Check customer info
  if (!orderData.customer) {
    errors.push('Customer information is required');
  } else {
    if (!orderData.customer.name) {
      errors.push('Customer name is required');
    }
    
    if (!orderData.customer.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderData.customer.email)) {
      errors.push('Invalid email format');
    }
    
    if (!orderData.customer.phone) {
      errors.push('Phone number is required');
    }
    
    if (!orderData.customer.address) {
      errors.push('Address is required');
    }
  }
  
  // Check total
  if (!orderData.total || orderData.total <= 0) {
    errors.push('Invalid order total');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Process payment data
export function processPaymentData(orderData: any, paymentDetails: any): any {
  return {
    orderId: orderData.orderId,
    amount: orderData.total,
    currency: 'INR',
    customer: {
      name: orderData.customer.name,
      email: orderData.customer.email,
      phone: orderData.customer.phone
    },
    paymentMethod: paymentDetails.method || 'card',
    metadata: {
      items: orderData.items.map((item: CartItem) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }))
    }
  };
}
