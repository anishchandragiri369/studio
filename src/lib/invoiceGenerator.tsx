// Types and interfaces for invoice generation
// Note: Actual PDF generation is now handled by Netlify functions

export interface InvoiceData {
  order: {
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    items: any[];
    shipping_address: any;
    user_id: string;
    order_type?: string;
    subtotal?: number;
    discount_amount?: number;
    tax_amount?: number;
    delivery_charges?: number;
    applied_coupon?: any;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    gst?: string;
  };
}

// Helper function to prepare invoice data
export const prepareInvoiceData = (order: any, customer: any): InvoiceData => {
  return {
    order: {
      id: order.id,
      created_at: order.created_at,
      total_amount: order.total_amount,
      status: order.status,
      items: order.items || [],
      shipping_address: order.shipping_address,
      user_id: order.user_id,
      order_type: order.order_type,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      delivery_charges: order.delivery_charges,
      applied_coupon: order.applied_coupon
    },
    customer: {
      name: customer?.name || customer?.full_name || order.shipping_address?.fullName || 'Customer',
      email: customer?.email || 'customer@example.com',
      phone: customer?.phone || order.shipping_address?.phone
    },
    company: {
      name: 'Elixr Studio',
      address: 'Premium Wellness Beverages',
      phone: '+91 98765 43210',
      email: 'orders@elixrstudio.com',
      website: 'www.elixrstudio.com',
      gst: 'GST123456789'
    }
  };
};

// Legacy function for backward compatibility
// This now redirects to the Netlify function approach
export const generateOrderInvoice = async (order: any, customer: any): Promise<Buffer> => {
  console.warn('generateOrderInvoice is deprecated. Use Netlify functions for PDF generation.');
  
  // For development/testing, you can return a simple HTML buffer
  const invoiceData = prepareInvoiceData(order, customer);
  const html = generateSimpleHTML(invoiceData);
  return Buffer.from(html, 'utf-8');
};

// Simple HTML generator for development/testing
function generateSimpleHTML(data: InvoiceData): string {
  const subtotal = data.order.subtotal || 
    (data.order.items || []).reduce((sum, item) => 
      sum + ((item.quantity || 1) * (item.pricePerItem || item.price || 0)), 0
    );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${data.order.id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Invoice</h1>
        <p>Invoice #: ${data.order.id}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="invoice-details">
        <h3>Bill To:</h3>
        <p>${data.customer.name}</p>
        <p>${data.customer.email}</p>
        ${data.customer.phone ? `<p>${data.customer.phone}</p>` : ''}
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${(data.order.items || []).map(item => `
            <tr>
              <td>${item.name || item.juiceName || item.title || 'Product'}</td>
              <td>${item.quantity || 1}</td>
              <td>₹${(item.pricePerItem || item.price || 0).toFixed(2)}</td>
              <td>₹${((item.quantity || 1) * (item.pricePerItem || item.price || 0)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total">
        <p>Subtotal: ₹${(data.order.subtotal || subtotal).toFixed(2)}</p>
        ${data.order.discount_amount && data.order.discount_amount > 0 ? 
          `<p>Discount: ₹${data.order.discount_amount.toFixed(2)}</p>` : ''}
        <p><strong>Total: ₹${data.order.total_amount.toFixed(2)}</strong></p>
      </div>
      
      <div style="margin-top: 40px; text-align: center; color: #666;">
        <p>This is a development invoice. For production PDF generation, use Netlify functions.</p>
      </div>
    </body>
    </html>
  `;
}
