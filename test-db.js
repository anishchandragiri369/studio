require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Set up Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', !!supabaseUrl);
console.log('SUPABASE_KEY:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listOrders() {
  console.log('Fetching orders from database...');
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, email, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }
    
    console.log('Recent orders:');
    orders.forEach(order => {
      console.log(`- ID: ${order.id}, Email: ${order.email || 'N/A'}, Amount: ${order.total_amount}, Status: ${order.status}, Date: ${order.created_at}`);
    });
    
    return orders;
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

listOrders();
