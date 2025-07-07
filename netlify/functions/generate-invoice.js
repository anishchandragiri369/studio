const crypto = require('crypto');

const SIGNATURE_URL = process.env.NODE_ENV === 'production'
  ? 'https://develixr.netlify.app/images/signature.png'
  : 'http://localhost:9002/images/signature.png';

exports.handler = async (event, context) => {
  try {
    console.log('Invoice generation started');
    
    const { order, customer } = JSON.parse(event.body);
    
    if (!order) {
      throw new Error('Order data is required');
    }
    
    console.log('Order ID:', order.id);
    
    // Generate HTML with complete invoice template
    const html = generateInvoiceHTML({ order, customer });
    
    console.log('HTML generated successfully');
    
    // Return HTML instead of PDF for now
    // The client can use browser's print-to-PDF functionality
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="invoice-${order.id}.html"`
      },
      body: html
    };
    
  } catch (error) {
    console.error('Invoice generation error:', error);
    
    // Return a more detailed error response
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Invoice generation failed',
        message: error.message,
        stack: error.stack
      })
    };
  }
};

function generateInvoiceHTML(data) {
  const subtotal = data.order.subtotal || 
    (data.order.items || []).reduce((sum, item) => 
      sum + ((item.quantity || 1) * (item.pricePerItem || item.price || 0)), 0
    );

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${data.order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          font-size: 12px;
          color: #222;
          background: #fff;
        }
        .container {
          max-width: 650px;
          margin: 0 auto;
          padding: 32px 24px 24px 24px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .header-left {
          color: #888;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .header-right {
          text-align: right;
        }
        .invoice-type {
          font-weight: bold;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .address-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .address-box {
          width: 48%;
        }
        .section-title {
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          margin-bottom: 4px;
          color: #222;
        }
        .customer-name, .company-name {
          font-weight: bold;
          margin-bottom: 2px;
        }
        .address-line {
          margin-bottom: 2px;
        }
        .gst-fssai {
          font-size: 11px;
          color: #555;
          margin-top: 4px;
        }
        .table-section {
          margin: 24px 0 0 0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0;
        }
        .items-table th {
          background: #3a7c6c;
          color: #fff;
          font-weight: bold;
          font-size: 12px;
          padding: 8px 6px;
          border: none;
          text-align: left;
        }
        .items-table td {
          padding: 8px 6px;
          border-bottom: 1px solid #eee;
          font-size: 12px;
        }
        .items-table td:last-child, .items-table th:last-child {
          text-align: right;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 0;
        }
        .totals-box {
          background: #f5f7f8;
          border-radius: 4px;
          padding: 12px 18px 8px 18px;
          min-width: 220px;
          margin-top: 12px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .total-label {
          color: #555;
        }
        .total-value {
          font-weight: bold;
        }
        .total-main {
          font-size: 15px;
          font-weight: bold;
          color: #222;
          margin-top: 6px;
        }
        .total-gst {
          font-size: 11px;
          color: #555;
          margin-top: 2px;
        }
        .payment-section {
          margin-top: 24px;
        }
        .payment-title {
          font-weight: bold;
          text-transform: uppercase;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .payment-detail {
          margin-bottom: 2px;
        }
        .footer {
          margin-top: 18px;
          font-size: 10px;
          color: #888;
        }
        .footer-note {
          margin-bottom: 6px;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 32px;
        }
        .signature-box {
          width: 220px;
          text-align: center;
        }
        .signature-image {
          height: 40px;
          margin-bottom: 2px;
        }
        .signature-label {
          border-top: 1px solid #333;
          padding-top: 4px;
          font-size: 11px;
          color: #222;
        }
        .date-box {
          width: 120px;
          text-align: right;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            NO. ELX-${data.order.id.substring(0, 8).toUpperCase()}<br />
            DUE ${dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
          </div>
          <div class="header-right">
            <div class="invoice-type">TAX INVOICE/BILL OF SUPPLY/CASH MEMO</div>
          </div>
        </div>
        <div class="address-section">
          <div class="address-box">
            <div class="section-title">INVOICE TO</div>
            <div class="customer-name">
              ${data.order.shipping_address?.fullName ||
                ((data.order.shipping_address?.firstName || '') + ' ' + (data.order.shipping_address?.lastName || '')).trim() ||
                data.order.shipping_address?.name ||
                data.customer.name ||
                'Customer'}
            </div>
            ${[
              data.order.shipping_address?.addressLine1,
              data.order.shipping_address?.addressLine2,
              data.order.shipping_address?.address,
              data.order.shipping_address?.street
            ].flatMap(line => {
              if (!line) return [];
              if (typeof line === 'string') return [line];
              if (typeof line === 'object') {
                // Extract all string subfields from the object
                return Object.values(line).filter(v => typeof v === 'string' && v.trim() !== '');
              }
              return [];
            }).map(line => `<div class="address-line">${line}</div>`).join('')}
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
        <div class="table-section">
          <table class="items-table">
            <thead>
              <tr>
                <th>Product/Description</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${(data.order.items || []).map((item, index) => `
                <tr>
                  <td>${item.name || item.juiceName || item.title || 'Product'}</td>
                  <td>INR ${((item.quantity || 1) * (item.pricePerItem || item.price || 0)).toFixed(0)}/-</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
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
            <div class="signature-placeholder" style="height: 40px; border-bottom: 1px solid #333; margin-bottom: 2px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666;">
              [Signature]
            </div>
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