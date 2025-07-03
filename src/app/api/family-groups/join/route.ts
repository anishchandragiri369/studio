import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { invite_code, user_id } = await request.json();

    if (!invite_code || !user_id) {
      return NextResponse.json(
        { error: 'Invite code and user ID are required' },
        { status: 400 }
      );
    }

    // Get family group by invite code
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select(`
        *,
        family_group_members(id, user_id)
      `)
      .eq('invite_code', invite_code)
      .eq('is_active', true)
      .single();

    if (groupError || !familyGroup) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = familyGroup.family_group_members?.find(
      (member: any) => member.user_id === user_id
    );

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this family group' },
        { status: 400 }
      );
    }

    // Check if family group is at capacity
    const currentMemberCount = familyGroup.family_group_members?.length || 0;
    if (currentMemberCount >= familyGroup.max_members) {
      return NextResponse.json(
        { error: 'Family group is at maximum capacity' },
        { status: 400 }
      );
    }

    // Check if user is the primary user (can't join their own group)
    if (familyGroup.primary_user_id === user_id) {
      return NextResponse.json(
        { error: 'You cannot join your own family group' },
        { status: 400 }
      );
    }

    // Add user to family group
    const { data: newMember, error: memberError } = await supabase
      .from('family_group_members')
      .insert({
        family_group_id: familyGroup.id,
        user_id,
        role: 'member',
        permissions: {
          can_pause: true,
          can_modify_address: false,
          can_view_billing: false
        },
        notification_preferences: {
          delivery_reminders: true,
          group_updates: true
        }
      })
      .select()
      .single();

    if (memberError) {
      console.error('Error adding family member:', memberError);
      return NextResponse.json(
        { error: 'Failed to join family group' },
        { status: 500 }
      );
    }

    // Create notification for primary user
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id: familyGroup.primary_user_id,
        type: 'family_member_joined',
        title: 'New family member joined',
        message: `A new member has joined your family group "${familyGroup.group_name}".`,
        related_id: familyGroup.id,
        related_type: 'family_group'
      });

    // Create welcome notification for new member
    await supabase
      .from('subscription_notifications')
      .insert({
        user_id,
        type: 'family_group_joined',
        title: 'Welcome to the family!',
        message: `You have successfully joined the family group "${familyGroup.group_name}".`,
        related_id: familyGroup.id,
        related_type: 'family_group'
      });

    return NextResponse.json({
      success: true,
      member: newMember,
      family_group: familyGroup,
      message: 'Successfully joined family group'
    });

  } catch (error) {
    console.error('Error joining family group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
