import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[admin-download-report] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      supabaseUrl: supabaseUrl?.substring(0, 20) + '...'
    });

    if (!supabaseUrl) {
      return NextResponse.json({ 
        error: 'Missing NEXT_PUBLIC_SUPABASE_URL',
        details: 'Supabase URL is required but not configured'
      }, { status: 500 });
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing SUPABASE_SERVICE_ROLE_KEY',
        details: 'Service role key is required for admin operations. Get it from Supabase Dashboard > Settings > API',
        instructions: [
          '1. Go to https://supabase.com/dashboard',
          '2. Select your project',
          '3. Go to Settings > API',
          '4. Copy the "service_role" key (not anon key)',
          '5. Add SUPABASE_SERVICE_ROLE_KEY=your_key to .env file'
        ]
      }, { status: 500 });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);    console.log('[admin-download-report] Fetching user subscriptions...');

    // Fetch user subscriptions first
    const { data: userSubscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subscriptionsError) {
      console.error('[admin-download-report] User subscriptions error:', subscriptionsError);
      return NextResponse.json({ 
        error: 'Failed to fetch user subscriptions', 
        details: subscriptionsError.message 
      }, { status: 500 });
    }

    console.log('[admin-download-report] Fetched user subscriptions:', userSubscriptions?.length || 0);

    // Fetch subscription deliveries
    const { data: subscriptionDeliveries, error: deliveriesError } = await supabase
      .from('subscription_deliveries')
      .select('*');

    if (deliveriesError) {
      console.warn('[admin-download-report] Could not fetch subscription deliveries:', deliveriesError);
    }

    // Fetch juices for reference
    const { data: juices, error: juicesError } = await supabase
      .from('juices')
      .select('*');

    if (juicesError) {
      console.warn('[admin-download-report] Could not fetch juices:', juicesError);
    }

    console.log('[admin-download-report] Fetched deliveries:', subscriptionDeliveries?.length || 0);
    console.log('[admin-download-report] Fetched juices:', juices?.length || 0);

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
    };    userSubscriptions?.forEach((subscription: any) => {
      // Calculate juice details - we'll need to map juice IDs to names if available
      const subscriptionJuices = subscription.selected_juices || subscription.juices || [];
      let juiceNames = '';
      let totalQuantity = 0;
      
      if (Array.isArray(subscriptionJuices)) {
        // If it's an array of juice IDs or objects
        juiceNames = subscriptionJuices.map((juice: any) => {
          if (typeof juice === 'string' || typeof juice === 'number') {
            // It's a juice ID, try to find the name from juices table
            const juiceData = juices?.find(j => j.id === juice);
            return juiceData?.name || `Juice ${juice}`;
          } else if (juice.name || juice.juice_name) {
            // It's an object with name
            return `${juice.name || juice.juice_name}${juice.quantity ? ` (${juice.quantity})` : ''}`;
          }
          return 'Unknown Juice';
        }).join(', ');
        
        totalQuantity = subscriptionJuices.reduce((sum: number, juice: any) => {
          const qty = juice.quantity || 1;
          return sum + qty;
        }, 0);
      } else if (typeof subscriptionJuices === 'string') {
        // It might be JSON string
        try {
          const parsed = JSON.parse(subscriptionJuices);
          juiceNames = Array.isArray(parsed) ? parsed.join(', ') : subscriptionJuices;
        } catch {
          juiceNames = subscriptionJuices;
        }
      }

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
        totalRevenue += parseFloat(subscription.price || subscription.plan_price || '0');
      }

      // Add row to worksheet
      worksheet.addRow([
        subscription.id,
        subscription.customer_name || subscription.name || '',
        subscription.email || '',
        subscription.phone || subscription.phone_number || '',
        subscription.status || '',
        subscription.plan_type || subscription.subscription_type || '',
        subscription.plan_duration || subscription.duration || '',
        subscription.price ? `₹${subscription.price}` : (subscription.plan_price ? `₹${subscription.plan_price}` : ''),
        formatDate(subscription.start_date),
        formatDate(subscription.next_delivery_date || subscription.next_delivery),
        formatDate(subscription.expiration_date || subscription.end_date),
        subscription.address_line_1 || subscription.address?.line1 || '',
        subscription.address_line_2 || subscription.address?.line2 || '',
        subscription.city || subscription.address?.city || '',
        subscription.state || subscription.address?.state || '',
        subscription.postal_code || subscription.address?.postal_code || '',
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
    };    // Summary data
    const summaryData = [
      ['Total Subscriptions', userSubscriptions?.length || 0],
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
    });    // Generate Excel buffer
    console.log('[admin-download-report] Generating Excel buffer...');
    const buffer = await workbook.xlsx.writeBuffer();

    // Create filename with current date
    const today = new Date().toISOString().split('T')[0];
    const filename = `Elixr_Subscription_Report_${today}.xlsx`;    console.log('[admin-download-report] Report generated successfully:', {
      filename,
      bufferSize: buffer.byteLength,
      subscriptionCount: userSubscriptions?.length || 0
    });

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
    console.error('[admin-download-report] Error generating report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate report', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
