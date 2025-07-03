import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      transfer_id,
      buyer_user_id,
      offered_price,
      message
    } = await request.json();

    // Validate required fields
    if (!transfer_id || !buyer_user_id || !offered_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get transfer details
    const { data: transfer, error: transferError } = await supabase
      .from('subscription_transfers')
      .select('*')
      .eq('id', transfer_id)
      .single();

    if (transferError || !transfer) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Check if transfer is still available
    if (transfer.status !== 'listed') {
      return NextResponse.json(
        { error: 'Transfer is no longer available' },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(transfer.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Transfer has expired' },
        { status: 410 }
      );
    }

    // Check if buyer is the seller
    if (transfer.seller_user_id === buyer_user_id) {
      return NextResponse.json(
        { error: 'You cannot make an offer on your own transfer' },
        { status: 400 }
      );
    }

    // Check if buyer already has a pending offer
    const { data: existingOffer } = await supabase
      .from('subscription_transfer_offers')
      .select('id')
      .eq('transfer_id', transfer_id)
      .eq('buyer_user_id', buyer_user_id)
      .eq('status', 'pending')
      .single();

    if (existingOffer) {
      return NextResponse.json(
        { error: 'You already have a pending offer on this transfer' },
        { status: 400 }
      );
    }

    // Validate offer price
    const offerPrice = parseFloat(offered_price);
    if (offerPrice <= 0) {
      return NextResponse.json(
        { error: 'Offer price must be greater than 0' },
        { status: 400 }
      );
    }

    // Check if offer is too low (optional business rule)
    const minOffer = transfer.asking_price * 0.3; // Minimum 30% of asking price
    if (offerPrice < minOffer) {
      return NextResponse.json(
        { error: `Offer must be at least ₹${minOffer.toFixed(2)}` },
        { status: 400 }
      );
    }

    // Create the offer
    const { data: offer, error: offerError } = await supabase
      .from('subscription_transfer_offers')
      .insert({
        transfer_id,
        buyer_user_id,
        offered_price: offerPrice,
        message
      })
      .select()
      .single();

    if (offerError) {
      console.error('Error creating offer:', offerError);
      return NextResponse.json(
        { error: 'Failed to create offer' },
        { status: 500 }
      );
    }

    // Create notification for seller
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id: transfer.seller_user_id,
        type: 'transfer_offer_received',
        title: 'New offer on your transfer',
        message: `You received an offer of ₹${offerPrice} on your subscription transfer "${transfer.title}".`,
        related_id: offer.id,
        related_type: 'transfer_offer',
        is_action_required: true,
        action_url: `/transfers/${transfer_id}/offers`
      });

    // Create confirmation notification for buyer
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id: buyer_user_id,
        type: 'transfer_offer_sent',
        title: 'Offer submitted',
        message: `Your offer of ₹${offerPrice} has been submitted for "${transfer.title}".`,
        related_id: offer.id,
        related_type: 'transfer_offer'
      });

    return NextResponse.json({
      success: true,
      offer,
      message: 'Offer created successfully'
    });

  } catch (error) {
    console.error('Error creating transfer offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get('transfer_id');
    const userId = searchParams.get('user_id');

    if (!transferId) {
      return NextResponse.json(
        { error: 'Transfer ID is required' },
        { status: 400 }
      );
    }

    // Get all offers for the transfer
    const { data: offers, error } = await supabase
      .from('subscription_transfer_offers')
      .select('*')
      .eq('transfer_id', transferId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch offers' },
        { status: 500 }
      );
    }

    // If user_id is provided, only return offers from that user (for buyers)
    // or all offers (for sellers who own the transfer)
    let filteredOffers = offers || [];

    if (userId) {
      // Check if user is the seller
      const { data: transfer } = await supabase
        .from('subscription_transfers')
        .select('seller_user_id')
        .eq('id', transferId)
        .single();

      if (transfer?.seller_user_id !== userId) {
        // User is not the seller, only show their own offers
        filteredOffers = offers?.filter(offer => offer.buyer_user_id === userId) || [];
      }
    }

    return NextResponse.json({
      offers: filteredOffers
    });

  } catch (error) {
    console.error('Error fetching transfer offers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
