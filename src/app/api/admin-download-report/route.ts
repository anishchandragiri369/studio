import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all subscriptions with related data
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_juices (
          id,
          juice_name,
          quantity
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Subscription Report');

    // Set up the header row
    const headers = [
      'Subscription ID',
      'Customer Name',
      'Email',
      'Phone',
      'Status',
      'Plan Type',
      'Plan Duration',
      'Price',
      'Start Date',
      'Next Delivery',
      'Expiration Date',
      'Address Line 1',
      'Address Line 2',
      'City',
      'State',
      'Postal Code',
      'Juices',
      'Total Juice Quantity',
      'Created At',
      'Last Updated'
    ];

    // Add headers to the worksheet
    worksheet.addRow(headers);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' } // Blue background
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    // Add data rows
    let totalRevenue = 0;
    const statusCounts = {
      active: 0,
      paused: 0,
      expired: 0,
      cancelled: 0
    };

    subscriptions?.forEach((subscription: any) => {
      // Calculate juice details
      const juices = subscription.subscription_juices || [];
      const juiceNames = juices.map((j: any) => `${j.juice_name} (${j.quantity})`).join(', ');
      const totalQuantity = juices.reduce((sum: number, j: any) => sum + (j.quantity || 0), 0);

      // Format dates
      const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US');
      };

      // Count status
      const status = subscription.status?.toLowerCase() || 'unknown';
      if (status in statusCounts) {
        statusCounts[status as keyof typeof statusCounts]++;
      }

      // Add to revenue if active
      if (status === 'active') {
        totalRevenue += parseFloat(subscription.price || '0');
      }

      // Add row to worksheet
      worksheet.addRow([
        subscription.id,
        subscription.customer_name || '',
        subscription.email || '',
        subscription.phone || '',
        subscription.status || '',
        subscription.plan_type || '',
        subscription.plan_duration || '',
        subscription.price ? `₹${subscription.price}` : '',
        formatDate(subscription.start_date),
        formatDate(subscription.next_delivery_date),
        formatDate(subscription.expiration_date),
        subscription.address_line_1 || '',
        subscription.address_line_2 || '',
        subscription.city || '',
        subscription.state || '',
        subscription.postal_code || '',
        juiceNames,
        totalQuantity,
        formatDate(subscription.created_at),
        formatDate(subscription.updated_at)
      ]);
    });

    // Auto-size columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      if (column.eachCell) {
        column.eachCell({ includeEmpty: false }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
      }
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Add a summary section
    const summaryStartRow = worksheet.rowCount + 3;
    
    // Summary headers
    worksheet.getCell(`A${summaryStartRow}`).value = 'SUMMARY';
    worksheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 14 };
    worksheet.getCell(`A${summaryStartRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F3F4F6' }
    };

    // Summary data
    const summaryData = [
      ['Total Subscriptions', subscriptions?.length || 0],
      ['Active Subscriptions', statusCounts.active],
      ['Paused Subscriptions', statusCounts.paused],
      ['Expired Subscriptions', statusCounts.expired],
      ['Cancelled Subscriptions', statusCounts.cancelled],
      ['Total Active Revenue', `₹${totalRevenue.toFixed(2)}`],
      ['Report Generated', new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium'
      })]
    ];

    summaryData.forEach((row, index) => {
      const rowNum = summaryStartRow + index + 1;
      worksheet.getCell(`A${rowNum}`).value = row[0];
      worksheet.getCell(`B${rowNum}`).value = row[1];
      worksheet.getCell(`A${rowNum}`).font = { bold: true };
    });

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `Elixr_Subscription_Report_${today}.xlsx`;

    // Return the Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating admin report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
