import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    const { data: juices, error } = await supabase
      .from('juices')
      .select('*')
      .eq('is_active', true) // Only return active juices
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching juices:', error);
      return NextResponse.json(
        { error: 'Failed to fetch juices' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected Juice interface
    const transformedJuices = (juices || []).map(juice => {
      // Handle tags properly
      let tags = [];
      if (Array.isArray(juice.tags)) {
        tags = juice.tags;
      } else if (typeof juice.tags === 'string') {
        tags = juice.tags.split(',').map((tag: string) => tag.trim());
      }

      // Handle availability
      let availability = 'Out of Stock';
      if (juice.stock_quantity > 0) {
        availability = juice.stock_quantity <= 10 ? 'Low Stock' : 'In Stock';
      }

      return {
        id: juice.id,
        name: juice.name,
        flavor: juice.flavor,
        price: Number(juice.price),
        image: juice.image_url || juice.image || '/images/juice-placeholder.jpg',
        image_url: juice.image_url,
        description: juice.description,
        category: juice.category,
        tags: tags,
        dataAiHint: juice.data_ai_hint || juice.name.toLowerCase(),
        data_ai_hint: juice.data_ai_hint,
        stockQuantity: Number(juice.stock_quantity) || 0,
        stock_quantity: juice.stock_quantity,
        availability: availability
      };
    });

    return NextResponse.json({ 
      juices: transformedJuices,
      count: transformedJuices.length
    });

  } catch (error) {
    console.error('Error in juices API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
