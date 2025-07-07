import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role - only at runtime
let supabase: any = null;

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

function extractAddressLines(shippingAddress: any): string[] {
  const lines: string[] = [];
  
  if (!shippingAddress) return lines;
  
  // Handle different address field structures
  const addressFields = [
    shippingAddress.addressLine1,
    shippingAddress.addressLine2,
    shippingAddress.address,
    shippingAddress.street
  ];
  
  addressFields.forEach(field => {
    if (typeof field === 'string' && field.trim()) {
      lines.push(field.trim());
    } else if (typeof field === 'object' && field !== null) {
      // Extract string values from object
      Object.values(field).forEach(val => {
        if (typeof val === 'string' && val.trim()) {
          lines.push(val.trim());
        }
      });
    }
  });
  
  return lines;
}

function generateInvoiceHTML(data: { order: any; customer: any }) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  
  const subtotal = (data.order.items || []).reduce((sum: number, item: any) => {
    return sum + ((item.quantity || 1) * (item.pricePerItem || item.price || 0));
  }, 0);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${data.order.id}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .invoice-number { 
            font-size: 18px; 
            font-weight: bold; 
        }
        .due-date { 
            color: #666; 
        }
        .invoice-type {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        .address-section { 
            display: flex; 
            gap: 40px; 
            margin-bottom: 30px; 
        }
        .address-box { 
            flex: 1; 
        }
        .section-title { 
            font-weight: bold; 
            margin-bottom: 10px; 
            text-transform: uppercase;
            font-size: 12px;
        }
        .customer-name { 
            font-weight: bold; 
            margin-bottom: 5px; 
        }
        .company-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .address-line { 
            margin-bottom: 2px; 
        }
        .gst-fssai {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
        }
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
        }
        .items-table th, .items-table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        .items-table th { 
            background-color: #f5f5f5; 
            font-weight: bold; 
        }
        .totals-section { 
            text-align: right; 
        }
        .totals-box { 
            display: inline-block; 
            background: #f5f7f8; 
            padding: 15px; 
            border-radius: 4px; 
            min-width: 220px;
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 5px; 
        }
        .total-label {
            color: #555;
        }
        .total-value {
            font-weight: bold;
        }
        .total-main { 
            font-size: 16px; 
            font-weight: bold; 
            margin-top: 10px; 
            color: #333;
        }
        .total-gst {
            font-size: 11px;
            color: #666;
            margin-top: 5px;
        }
        .payment-section {
            margin-top: 20px;
        }
        .payment-title {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
            margin-bottom: 5px;
        }
        .payment-detail {
            margin-bottom: 2px;
            font-size: 12px;
        }
        .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #888;
        }
        .footer-note {
            margin-bottom: 5px;
        }
        .signature-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 40px;
        }
        .signature-box {
            width: 220px;
            text-align: center;
        }
        .signature-placeholder {
            height: 40px;
            border-bottom: 1px solid #333;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #666;
        }
        .signature-image {
            height: 40px;
            margin-bottom: 5px;
            object-fit: contain;
            max-width: 100%;
            filter: brightness(0.8) contrast(1.2);
        }
        .signature-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .signature-label {
            border-top: 1px solid #333;
            padding-top: 5px;
            font-size: 11px;
            color: #333;
        }
        .date-box {
            width: 120px;
            text-align: right;
            font-size: 11px;
        }
        @media print {
            body { margin: 0; background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="invoice-number">NO. ELX-${data.order.id.substring(0, 8).toUpperCase()}</div>
                <div class="due-date">DUE ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div>
            </div>
            <div>
                <div class="invoice-type">TAX INVOICE/BILL OF SUPPLY/CASH MEMO</div>
            </div>
        </div>
        
        <div class="address-section">
            <div class="address-box">
                <div class="section-title">INVOICE TO</div>
                <div class="customer-name">
                    ${(() => {
                      // Handle different name structures
                      const firstName = data.order.shipping_address?.firstName || '';
                      const lastName = data.order.shipping_address?.lastName || '';
                      const fullName = data.order.shipping_address?.fullName || '';
                      const name = data.order.shipping_address?.name || '';
                      
                      if (fullName) return fullName;
                      if (firstName || lastName) return `${firstName} ${lastName}`.trim();
                      if (name) return name;
                      if (data.customer?.name) return data.customer.name;
                      return 'Customer';
                    })()}
                </div>
                ${extractAddressLines(data.order.shipping_address).map(line => 
                  `<div class="address-line">${line}</div>`
                ).join('')}
                <div class="address-line">
                    ${[
                      data.order.shipping_address?.city,
                      data.order.shipping_address?.state
                    ].filter(Boolean).join(', ')}
                </div>
                <div class="address-line">
                    ${data.order.shipping_address?.zipCode || data.order.shipping_address?.pincode || ''}
                </div>
                <div class="address-line">
                    ${data.order.shipping_address?.country || ''}
                </div>
                <div class="address-line">
                    ${data.order.shipping_address?.mobileNumber || data.order.shipping_address?.phone ? 'Mobile: ' + (data.order.shipping_address?.mobileNumber || data.order.shipping_address?.phone) : ''}
                </div>
            </div>
            
            <div class="address-box">
                <div class="section-title">SOLD BY</div>
                <div class="company-name">Elixr Studio</div>
                <div class="address-line">Premium Wellness Beverages</div>
                <div class="address-line">+91 98765 43210</div>
                <div class="address-line">orders@elixrstudio.com</div>
                <div class="gst-fssai">GSTIN: GST123456789</div>
                <div class="gst-fssai">FSSAI: 23625028001350</div>
            </div>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>Product/Description</th>
                    <th>Price</th>
                </tr>
            </thead>
            <tbody>
                ${(data.order.items || []).map((item: any) => `
                    <tr>
                        <td>${item.name || item.juiceName || item.title || 'Product'}</td>
                        <td>INR ${((item.quantity || 1) * (item.pricePerItem || item.price || 0)).toFixed(0)}/-</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="totals-section">
            <div class="totals-box">
                <div class="total-row">
                    <span class="total-label">Subtotal</span>
                    <span class="total-value">INR ${(data.order.subtotal || subtotal).toFixed(0)}/-</span>
                </div>
                ${data.order.discount_amount && data.order.discount_amount > 0 ? `
                    <div class="total-row">
                        <span class="total-label">Discount 10%</span>
                        <span class="total-value">INR ${data.order.discount_amount.toFixed(0)}/-</span>
                    </div>
                ` : ''}
                <div class="total-row total-main">
                    <span>Total</span>
                    <span>INR ${data.order.total_amount.toFixed(0)}/-</span>
                </div>
                <div class="total-gst">(Including GST 12%)</div>
            </div>
        </div>
        
        <div class="payment-section">
            <div class="payment-title">PAYMENT METHOD</div>
            <div class="payment-detail">Credit Card: XXXXXXXXXXXX1422</div>
            <div class="payment-detail">Card Type: VISA</div>
            <div class="payment-detail">Transaction ID: 516720918656</div>
        </div>
        
        <div class="footer">
            <div class="footer-note">Products once sold will not be returned or exchanged. In case of any service dissatisfaction, please contact us within 2 days.</div>
            <div class="footer-note">This is a system-generated invoice and does not require a signature.</div>
        </div>
        
        <div class="signature-section">
            <div class="signature-box">
                <img src="/images/signature.png" alt="Signature" class="signature-image" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="signature-placeholder" style="display: none;">[Signature]</div>
                <div class="signature-label">Signature of Authorized Person</div>
            </div>
            <div class="date-box">
                Date<br />${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const userId = searchParams.get('userId');

  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch order details
    let { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    // If userId is provided, ensure user owns the order
    if (userId && (!order || order.user_id !== userId)) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch customer details
    let customer = null;
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();
      
      customer = profile;
    } else if (order.customer_info) {
      // Use customer info from order for guest orders
      customer = order.customer_info;
    }

    // Generate invoice HTML directly
    console.log('Order shipping address:', JSON.stringify(order.shipping_address, null, 2));
    console.log('Customer data:', JSON.stringify(customer, null, 2));
    
    const html = generateInvoiceHTML({ order, customer });

    console.log('Invoice HTML generated successfully');

    // Return HTML directly
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${order.id}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection not available' },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { orderId, userId, email } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order details
    let orderQuery = supabase
      .from('orders')
      .select('*')
      .eq('id', orderId);

    // If userId is provided, ensure user owns the order
    if (userId) {
      orderQuery = orderQuery.eq('user_id', userId);
    }

    const { data: orders, error: orderError } = await orderQuery;

    if (orderError || !orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // For guest orders, verify email if provided
    if (!userId && email && order.customer_info?.email !== email) {
      return NextResponse.json(
        { error: 'Invalid email for this order' },
        { status: 403 }
      );
    }

    // Fetch customer details
    let customer = null;
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();
      
      customer = profile;
    } else if (order.customer_info) {
      // Use customer info from order for guest orders
      customer = order.customer_info;
    }

    // Generate invoice HTML directly
    console.log('Order shipping address:', JSON.stringify(order.shipping_address, null, 2));
    console.log('Customer data:', JSON.stringify(customer, null, 2));
    
    const html = generateInvoiceHTML({ order, customer });

    console.log('Invoice HTML generated successfully');

    // Return HTML directly
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${order.id}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
