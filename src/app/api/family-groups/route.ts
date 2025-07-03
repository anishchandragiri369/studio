import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate a unique invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'FAM';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const {
      group_name,
      primary_user_id,
      max_members,
      shared_delivery_address,
      allow_individual_deliveries
    } = await request.json();

    // Validate required fields
    if (!group_name || !primary_user_id) {
      return NextResponse.json(
        { error: 'Group name and primary user ID are required' },
        { status: 400 }
      );
    }

    // Check if user already has a family group as primary user
    const { data: existingGroup } = await supabase
      .from('family_groups')
      .select('id')
      .eq('primary_user_id', primary_user_id)
      .eq('is_active', true)
      .single();

    if (existingGroup) {
      return NextResponse.json(
        { error: 'You already have an active family group' },
        { status: 400 }
      );
    }

    // Generate unique invite code
    let invite_code = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const { data: existingCode } = await supabase
        .from('family_groups')
        .select('id')
        .eq('invite_code', invite_code)
        .single();

      if (!existingCode) break;
      
      invite_code = generateInviteCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique invite code' },
        { status: 500 }
      );
    }

    // Create family group
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .insert({
        group_name,
        primary_user_id,
        invite_code,
        max_members: max_members || 6,
        shared_delivery_address,
        allow_individual_deliveries: allow_individual_deliveries ?? true
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating family group:', groupError);
      return NextResponse.json(
        { error: 'Failed to create family group' },
        { status: 500 }
      );
    }

    // Add primary user as admin member
    const { error: memberError } = await supabase
      .from('family_group_members')
      .insert({
        family_group_id: familyGroup.id,
        user_id: primary_user_id,
        role: 'admin',
        permissions: {
          can_pause: true,
          can_modify_address: true,
          can_view_billing: true
        }
      });

    if (memberError) {
      console.error('Error adding primary member:', memberError);
      // Cleanup: delete the family group if member creation failed
      await supabase
        .from('family_groups')
        .delete()
        .eq('id', familyGroup.id);

      return NextResponse.json(
        { error: 'Failed to create family group' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      family_group: familyGroup,
      message: 'Family group created successfully'
    });

  } catch (error) {
    console.error('Error in family group creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const inviteCode = searchParams.get('invite_code');

    if (inviteCode) {
      // Get family group by invite code
      const { data: familyGroup, error } = await supabase
        .from('family_groups')
        .select(`
          *,
          family_group_members(
            id,
            user_id,
            role,
            joined_at,
            permissions
          )
        `)
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .single();

      if (error || !familyGroup) {
        return NextResponse.json(
          { error: 'Family group not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ family_group: familyGroup });
    }

    if (userId) {
      // Get user's family groups
      const { data: userGroups, error } = await supabase
        .from('family_group_members')
        .select(`
          *,
          family_groups(
            *,
            family_group_members(
              id,
              user_id,
              role,
              joined_at
            )
          )
        `)
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch family groups' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        family_groups: userGroups?.map(ug => ug.family_groups) || []
      });
    }

    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching family groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
