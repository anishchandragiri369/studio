import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculateFirstDeliveryDate } from '@/lib/deliveryScheduler';
import { validateAdminPauseForSubscription } from '@/lib/adminPauseHelper';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      planId,
      startDate,
      endDate,
      deliveryAddress,
      selectedBowls,
      specialInstructions,
      totalAmount
    } = body;

    // Check for admin pause before allowing subscription creation
    const adminPauseValidation = await validateAdminPauseForSubscription(session.user.id);
    if (!adminPauseValidation.canProceed) {
      return NextResponse.json(
        { error: adminPauseValidation.message, adminPause: true },
        { status: 423 } // 423 Locked
      );
    }

    // Validate required fields
    if (!planId || !startDate || !endDate || !deliveryAddress || !selectedBowls || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate proper first delivery date based on 6 PM cutoff
    const deliverySchedule = calculateFirstDeliveryDate();
    const firstDeliveryDate = new Date(deliverySchedule.firstDeliveryDate);
    firstDeliveryDate.setHours(8, 0, 0, 0); // Set to 8 AM

    // Create the subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_fruit_bowl_subscriptions')
      .insert({
        user_id: session.user.id,
        plan_id: planId,
        start_date: startDate,
        end_date: endDate,
        next_delivery_date: firstDeliveryDate.toISOString(),
        delivery_address: deliveryAddress,
        selected_bowls: selectedBowls,
        special_instructions: specialInstructions,
        total_amount: totalAmount,
        status: 'active',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating fruit bowl subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Create delivery schedule (this should ideally be done in a background job)
    const deliveryDates = generateDeliveryDates(firstDeliveryDate.toISOString(), endDate);
    const deliveries = deliveryDates.map(date => ({
      subscription_id: subscription.id,
      delivery_date: date,
      time_slot: '8:00 AM - 10:00 AM', // Default time slot
      bowls: selectedBowls[date] || selectedBowls.default || [],
      quantity_per_bowl: { default: 1 },
      status: 'scheduled'
    }));

    const { error: deliveriesError } = await supabase
      .from('fruit_bowl_subscription_deliveries')
      .insert(deliveries);

    if (deliveriesError) {
      console.error('Error creating delivery schedule:', deliveriesError);
      // Note: In production, you might want to rollback the subscription creation
    }

    return NextResponse.json({ 
      subscription,
      message: 'Fruit bowl subscription created successfully' 
    });

  } catch (error) {
    console.error('Error in fruit bowl subscription creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: subscriptions, error } = await supabase
      .from('user_fruit_bowl_subscriptions')
      .select(`
        *,
        plan:fruit_bowl_subscription_plans(*)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user fruit bowl subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscriptions: subscriptions || [] });

  } catch (error) {
    console.error('Error in fruit bowl subscriptions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate delivery dates
function generateDeliveryDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    // Skip Sundays (0 = Sunday)
    if (date.getDay() !== 0) {
      const deliveryDate = new Date(date);
      deliveryDate.setHours(8, 0, 0, 0); // Set to 8 AM
      dates.push(deliveryDate.toISOString());
    }
  }
  
  return dates;
}
