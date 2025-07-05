import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateReferralCode } from '@/lib/rewards';

// Create admin client for backend operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to process referral rewards
async function processReferralCode(userId: string, referralCode: string) {
  console.log('[processReferralCode] Processing referral code:', referralCode);

  // Validate referral code and get referrer (case-insensitive)
  const { data: referrer, error: referrerError } = await supabaseAdmin
    .from('user_rewards')
    .select('user_id, referral_code')
    .ilike('referral_code', referralCode)
    .single();

  if (referrer && !referrerError) {
    try {
      // Create referral reward record
      const { data: reward, error: rewardError } = await supabaseAdmin
        .from('referral_rewards')
        .insert([{
          referrer_id: referrer.user_id,
          referred_user_id: userId,
          referral_code: referralCode.toUpperCase(),
          reward_points: 100, // REWARD_CONFIG.REFERRAL_REWARD_POINTS
          reward_amount: 50,  // REWARD_CONFIG.REFERRAL_REWARD_AMOUNT
          status: 'completed',
          order_id: null, // No order for OAuth signups
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (!rewardError && reward) {
        // Update referrer's reward points
        const { data: currentRewards } = await supabaseAdmin
          .from('user_rewards')
          .select('total_points, total_earned, referrals_count')
          .eq('user_id', referrer.user_id)
          .single();

        await supabaseAdmin
          .from('user_rewards')
          .update({
            total_points: (currentRewards?.total_points || 0) + 100,
            total_earned: (currentRewards?.total_earned || 0) + 50,
            referrals_count: (currentRewards?.referrals_count || 0) + 1,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', referrer.user_id);

        // Create reward transaction record
        await supabaseAdmin
          .from('reward_transactions')
          .insert([{
            user_id: referrer.user_id,
            type: 'earned',
            points: 100,
            amount: 50,
            description: `Referral reward for ${referralCode}`,
            order_id: null, // No order for OAuth signups
            referral_id: reward.id,
            created_at: new Date().toISOString()
          }]);

        console.log('[processReferralCode] Referral reward processed successfully');
        return true;
      }
    } catch (error) {
      console.error('[processReferralCode] Error processing referral:', error);
    }
  } else {
    console.log('[processReferralCode] Invalid referral code or referrer not found');
  }
  
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required.' },
        { status: 400 }
      );
    }

    console.log('[setup-oauth-user] Setting up user:', userId);

    // Check if user already has rewards record
    const { data: existingRewards } = await supabaseAdmin
      .from('user_rewards')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existingRewards) {
      console.log('[setup-oauth-user] User already has rewards record');
      // Still check for referral code processing if this is a new OAuth user
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError || !userData.user) {
        return NextResponse.json(
          { success: false, message: 'User not found.' },
          { status: 404 }
        );
      }
      
      // Check if user has a referral code in metadata that hasn't been processed
      const storedReferralCode = userData.user.user_metadata?.referral_code;
      if (storedReferralCode) {
        console.log('[setup-oauth-user] Found unprocessed referral code:', storedReferralCode);
        
        // Check if referral reward already exists
        const { data: existingReward } = await supabaseAdmin
          .from('referral_rewards')
          .select('id')
          .eq('referred_user_id', userId)
          .single();
        
        if (!existingReward) {
          console.log('[setup-oauth-user] Processing referral code for existing user');
          await processReferralCode(userId, storedReferralCode);
        } else {
          console.log('[setup-oauth-user] Referral already processed');
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'User already set up.'
      });
    }

    // Get user data to generate referral code
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user) {
      console.error('[setup-oauth-user] Error fetching user:', userError);
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }

    // Generate unique referral code
    let newUserReferralCode;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      newUserReferralCode = generateReferralCode(userData.user.email || userData.user.id);
      
      // Check if this referral code already exists
      const { data: existingCode } = await supabaseAdmin
        .from('user_rewards')
        .select('referral_code')
        .eq('referral_code', newUserReferralCode)
        .single();
      
      if (!existingCode) {
        break; // Code is unique, use it
      }
      
      attempts++;
      console.log(`[setup-oauth-user] Referral code ${newUserReferralCode} exists, retrying... (${attempts}/${maxAttempts})`);
      
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      // Fallback: use timestamp to ensure uniqueness
      newUserReferralCode = `ELX.${Date.now().toString(36).toUpperCase()}`;
      console.log(`[setup-oauth-user] Using timestamp-based code: ${newUserReferralCode}`);
    }

    // Create user rewards record
    const { error: rewardsError } = await supabaseAdmin
      .from('user_rewards')
      .insert({
        user_id: userId,
        total_points: 0,
        redeemed_points: 0,
        referral_code: newUserReferralCode,
        total_earned: 0,
        referrals_count: 0
      });

    if (rewardsError) {
      console.error('[setup-oauth-user] Error creating rewards record:', rewardsError);
      return NextResponse.json(
        { success: false, message: 'Failed to set up user rewards.' },
        { status: 500 }
      );
    }

    console.log('[setup-oauth-user] User rewards record created successfully');

    // Check if user has a referral code in metadata to process
    const storedReferralCode = userData.user.user_metadata?.referral_code;
    if (storedReferralCode) {
      console.log('[setup-oauth-user] Processing stored referral code:', storedReferralCode);

      // Validate referral code and get referrer (case-insensitive)
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from('user_rewards')
        .select('user_id, referral_code')
        .ilike('referral_code', storedReferralCode)
        .single();

      if (referrer && !referrerError) {
        console.log('[setup-oauth-user] Found valid referrer:', referrer.user_id);
        try {
          // Create referral reward record
          const { data: reward, error: rewardError } = await supabaseAdmin
            .from('referral_rewards')
            .insert([{
              referrer_id: referrer.user_id,
              referred_user_id: userId,
              referral_code: storedReferralCode.toUpperCase(),
              reward_points: 100, // REWARD_CONFIG.REFERRAL_REWARD_POINTS
              reward_amount: 50,  // REWARD_CONFIG.REFERRAL_REWARD_AMOUNT
              status: 'completed',
              order_id: null, // No order for OAuth signups
              created_at: new Date().toISOString(),
              completed_at: new Date().toISOString()
            }])
            .select('id')
            .single();

          if (!rewardError && reward) {
            // Update referrer's reward points
            const { data: currentRewards } = await supabaseAdmin
              .from('user_rewards')
              .select('total_points, total_earned, referrals_count')
              .eq('user_id', referrer.user_id)
              .single();

            await supabaseAdmin
              .from('user_rewards')
              .update({
                total_points: (currentRewards?.total_points || 0) + 100,
                total_earned: (currentRewards?.total_earned || 0) + 50,
                referrals_count: (currentRewards?.referrals_count || 0) + 1,
                last_updated: new Date().toISOString()
              })
              .eq('user_id', referrer.user_id);

            // Create reward transaction record
            await supabaseAdmin
              .from('reward_transactions')
              .insert([{
                user_id: referrer.user_id,
                type: 'earned',
                points: 100,
                amount: 50,
                description: `Referral reward for ${storedReferralCode}`,
                order_id: null, // No order for OAuth signups
                referral_id: reward.id,
                created_at: new Date().toISOString()
              }]);

            console.log('[setup-oauth-user] Referral reward processed successfully');
          } else {
            console.log('[setup-oauth-user] Failed to create referral reward:', rewardError);
          }
        } catch (referralError) {
          console.error('[setup-oauth-user] Error processing referral:', referralError);
          // Don't fail the whole setup if referral processing fails
        }
      } else {
        console.log('[setup-oauth-user] Invalid referral code or referrer not found:', { referrer, referrerError });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OAuth user setup completed successfully.',
      referralCode: newUserReferralCode
    });

  } catch (error) {
    console.error('[setup-oauth-user] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
