import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

export class InvoiceGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
  }

  generateInvoice(data: InvoiceData): jsPDF {
    this.addHeader(data.company);
    this.addInvoiceInfo(data.order);
    this.addCustomerInfo(data.customer, data.order.shipping_address);
    this.addItemsTable(data.order.items);
    this.addTotals(data.order);
    this.addFooter(data.company);
    
    return this.doc;
  }

  private addHeader(company: InvoiceData['company']) {
    // Company Name
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(company.name, this.margin, 30);

    // Company Details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    const companyLines = [
      company.address,
      `Phone: ${company.phone}`,
      `Email: ${company.email}`,
      `Website: ${company.website}`
    ];
    
    if (company.gst) {
      companyLines.push(`GST: ${company.gst}`);
    }

    let yPos = 40;
    companyLines.forEach(line => {
      this.doc.text(line, this.margin, yPos);
      yPos += 5;
    });

    // Invoice Title
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('INVOICE', this.pageWidth - 60, 30);

    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 70, this.pageWidth - this.margin, 70);
  }

  private addInvoiceInfo(order: InvoiceData['order']) {
    const startY = 80;
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    
    // Invoice details on the right
    const rightX = this.pageWidth - 80;
    
    this.doc.text('Invoice Number:', rightX - 40, startY);
    this.doc.text('Order ID:', rightX - 40, startY + 8);
    this.doc.text('Invoice Date:', rightX - 40, startY + 16);
    this.doc.text('Order Status:', rightX - 40, startY + 24);
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`INV-${order.id}`, rightX, startY);
    this.doc.text(order.id, rightX, startY + 8);
    this.doc.text(new Date(order.created_at).toLocaleDateString('en-IN'), rightX, startY + 16);
    this.doc.text(order.status, rightX, startY + 24);
  }

  private addCustomerInfo(customer: InvoiceData['customer'], shippingAddress: any) {
    const startY = 80;
    
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Bill To:', this.margin, startY);
    
    this.doc.setFont('helvetica', 'normal');
    let yPos = startY + 8;
    
    // Customer details
    const customerLines = [
      customer.name,
      customer.email,
    ];
    
    if (customer.phone) {
      customerLines.push(customer.phone);
    }
    
    customerLines.forEach(line => {
      this.doc.text(line, this.margin, yPos);
      yPos += 6;
    });

    // Shipping address if available
    if (shippingAddress) {
      yPos += 4;
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Ship To:', this.margin, yPos);
      yPos += 8;
      
      this.doc.setFont('helvetica', 'normal');
      const addressLines = [
        shippingAddress.fullName || customer.name,
        shippingAddress.addressLine1,
        shippingAddress.addressLine2,
        `${shippingAddress.city}, ${shippingAddress.state}`,
        `${shippingAddress.country} - ${shippingAddress.zipCode}`
      ].filter(Boolean);
      
      addressLines.forEach(line => {
        this.doc.text(line, this.margin, yPos);
        yPos += 6;
      });
      
      if (shippingAddress.phone) {
        this.doc.text(`Phone: ${shippingAddress.phone}`, this.margin, yPos);
      }
    }
  }

  private addItemsTable(items: any[]) {
    const startY = 160;
    
    // Prepare table data
    const tableData = items.map((item, index) => [
      index + 1,
      item.name || item.juiceName || item.title || 'Product',
      item.quantity || 1,
      `₹${(item.pricePerItem || item.price || 0).toFixed(2)}`,
      `₹${((item.quantity || 1) * (item.pricePerItem || item.price || 0)).toFixed(2)}`
    ]);

    this.doc.autoTable({
      startY: startY,
      head: [['S.No', 'Product Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: this.margin, right: this.margin }
    });
  }

  private addTotals(order: InvoiceData['order']) {
    const finalY = (this.doc as any).lastAutoTable.finalY + 10;
    const rightX = this.pageWidth - this.margin;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    let yPos = finalY;
    
    // Calculate subtotal if not provided
    const subtotal = order.subtotal || order.items.reduce((sum, item) => 
      sum + ((item.quantity || 1) * (item.pricePerItem || item.price || 0)), 0
    );
    
    // Subtotal
    this.doc.text('Subtotal:', rightX - 40, yPos);
    this.doc.text(`₹${subtotal.toFixed(2)}`, rightX, yPos, { align: 'right' });
    yPos += 8;
    
    // Discount if applicable
    if (order.discount_amount && order.discount_amount > 0) {
      this.doc.text('Discount:', rightX - 40, yPos);
      this.doc.text(`-₹${order.discount_amount.toFixed(2)}`, rightX, yPos, { align: 'right' });
      yPos += 8;
    }
    
    // Coupon if applicable
    if (order.applied_coupon) {
      this.doc.text(`Coupon (${order.applied_coupon.code}):`, rightX - 40, yPos);
      this.doc.text(`-₹${order.applied_coupon.discount_amount?.toFixed(2) || '0.00'}`, rightX, yPos, { align: 'right' });
      yPos += 8;
    }
    
    // Delivery charges
    if (order.delivery_charges && order.delivery_charges > 0) {
      this.doc.text('Delivery Charges:', rightX - 40, yPos);
      this.doc.text(`₹${order.delivery_charges.toFixed(2)}`, rightX, yPos, { align: 'right' });
      yPos += 8;
    }
    
    // Tax if applicable
    if (order.tax_amount && order.tax_amount > 0) {
      this.doc.text('Tax:', rightX - 40, yPos);
      this.doc.text(`₹${order.tax_amount.toFixed(2)}`, rightX, yPos, { align: 'right' });
      yPos += 8;
    }
    
    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(rightX - 60, yPos, rightX, yPos);
    yPos += 8;
    
    // Total
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Total Amount:', rightX - 40, yPos);
    this.doc.text(`₹${order.total_amount.toFixed(2)}`, rightX, yPos, { align: 'right' });
  }

  private addFooter(company: InvoiceData['company']) {
    const footerY = this.pageHeight - 40;
    
    // Thank you message
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Thank you for your business!', this.margin, footerY);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('This is a computer generated invoice and does not require signature.', this.margin, footerY + 8);
    
    // Terms and conditions
    this.doc.setFontSize(8);
    this.doc.text('Terms & Conditions:', this.margin, footerY + 18);
    this.doc.text('• Payment is due within 30 days of invoice date.', this.margin, footerY + 23);
    this.doc.text('• All disputes are subject to jurisdiction of local courts.', this.margin, footerY + 28);
    this.doc.text('• For any queries, please contact us at ' + company.email, this.margin, footerY + 33);
  }

  downloadPDF(filename: string) {
    this.doc.save(filename);
  }

  getPDFBlob(): Blob {
    return this.doc.output('blob');
  }

  getPDFDataUri(): string {
    return this.doc.output('datauristring');
  }

  getPDFArrayBuffer(): ArrayBuffer {
    return this.doc.output('arraybuffer');
  }
}

// Helper function to generate invoice for an order
export const generateOrderInvoice = async (order: any, customer: any) => {
  const invoiceData: InvoiceData = {
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
      name: customer.name || customer.full_name || order.shipping_address?.fullName || 'Customer',
      email: customer.email || 'customer@example.com',
      phone: customer.phone || order.shipping_address?.phone
    },
    company: {
      name: 'Elixr Studio',
      address: 'Premium Wellness Beverages\nHealthy Living, Natural Taste',
      phone: '+91 98765 43210',
      email: 'orders@elixrstudio.com',
      website: 'www.elixrstudio.com',
      gst: 'GST123456789' // Add actual GST number if available
    }
  };

  const generator = new InvoiceGenerator();
  generator.generateInvoice(invoiceData);
  return generator;
};
