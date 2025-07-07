'use client';

import React, { useRef } from 'react';

interface InvoicePDFProps {
  order: any;
  customer: any;
  onClose: () => void;
}

export default function InvoicePDF({ order, customer, onClose }: InvoicePDFProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      window.print();
    }
  };

  const handleDownload = () => {
    // Create a blob URL for the HTML content
    const htmlContent = printRef.current?.innerHTML || '';
    const blob = new Blob([`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .invoice-number { font-size: 18px; font-weight: bold; }
            .due-date { color: #666; }
            .address-section { display: flex; gap: 40px; margin-bottom: 30px; }
            .address-box { flex: 1; }
            .section-title { font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
            .customer-name { font-weight: bold; margin-bottom: 5px; }
            .address-line { margin-bottom: 2px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .items-table th { background-color: #f5f5f5; font-weight: bold; }
            .totals-section { text-align: right; }
            .totals-box { display: inline-block; background: #f5f7f8; padding: 15px; border-radius: 4px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-main { font-size: 16px; font-weight: bold; margin-top: 10px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `], { type: 'text/html' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const subtotal = (order.items || []).reduce((sum: number, item: any) => {
    return sum + ((item.quantity || 1) * (item.pricePerItem || item.price || 0));
  }, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4 no-print">
            <h2 className="text-xl font-bold">Invoice Preview</h2>
            <div className="space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Print PDF
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download HTML
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
          
          <div ref={printRef} className="invoice-container">
            <div className="header">
              <div>
                <div className="invoice-number">NO. ELX-{order.id.substring(0, 8).toUpperCase()}</div>
                <div className="due-date">DUE {dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div>
              </div>
              <div>
                <div className="section-title">TAX INVOICE/BILL OF SUPPLY/CASH MEMO</div>
              </div>
            </div>

            <div className="address-section">
              <div className="address-box">
                <div className="section-title">INVOICE TO</div>
                <div className="customer-name">
                  {order.shipping_address?.fullName ||
                    ((order.shipping_address?.firstName || '') + ' ' + (order.shipping_address?.lastName || '')).trim() ||
                    order.shipping_address?.name ||
                    customer?.name ||
                    'Customer'}
                </div>
                {[
                  order.shipping_address?.addressLine1,
                  order.shipping_address?.addressLine2,
                  order.shipping_address?.address,
                  order.shipping_address?.street
                ].filter(Boolean).map((line, index) => (
                  <div key={index} className="address-line">{line}</div>
                ))}
                <div className="address-line">
                  {[
                    order.shipping_address?.city,
                    order.shipping_address?.state
                  ].filter(Boolean).join(', ')}
                </div>
                <div className="address-line">
                  {order.shipping_address?.zipCode || order.shipping_address?.pincode || ''}
                </div>
                <div className="address-line">
                  {order.shipping_address?.country || ''}
                </div>
                <div className="address-line">
                  {order.shipping_address?.mobileNumber || order.shipping_address?.phone ? 
                    'Mobile: ' + (order.shipping_address?.mobileNumber || order.shipping_address?.phone) : ''}
                </div>
              </div>
              
              <div className="address-box">
                <div className="section-title">SOLD BY</div>
                <div className="customer-name">Elixr Studio</div>
                <div className="address-line">Premium Wellness Beverages</div>
                <div className="address-line">+91 98765 43210</div>
                <div className="address-line">orders@elixrstudio.com</div>
                <div className="address-line">GSTIN: GST123456789</div>
                <div className="address-line">FSSAI: 23625028001350</div>
              </div>
            </div>

            <table className="items-table">
              <thead>
                <tr>
                  <th>Product/Description</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item: any, index: number) => (
                  <tr key={index}>
                    <td>{item.name || item.juiceName || item.title || 'Product'}</td>
                    <td>INR {((item.quantity || 1) * (item.pricePerItem || item.price || 0)).toFixed(0)}/-</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="totals-section">
              <div className="totals-box">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>INR {subtotal.toFixed(0)}/-</span>
                </div>
                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="total-row">
                    <span>Discount 10%</span>
                    <span>INR {order.discount_amount.toFixed(0)}/-</span>
                  </div>
                )}
                <div className="total-row total-main">
                  <span>Total</span>
                  <span>INR {order.total_amount.toFixed(0)}/-</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">(Including GST 12%)</div>
              </div>
            </div>

            <div className="footer">
              <div className="mb-2">Products once sold will not be returned or exchanged. In case of any service dissatisfaction, please contact us within 2 days.</div>
              <div>This is a system-generated invoice and does not require a signature.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 