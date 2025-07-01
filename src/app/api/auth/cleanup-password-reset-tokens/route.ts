import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to clean up expired password reset tokens
 * This can be called by a cron job or manually
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('[CleanupTokens] Starting cleanup of expired password reset tokens...');

    // Call the cleanup function
    const { error: cleanupError } = await supabase.rpc('cleanup_expired_password_reset_tokens');

    if (cleanupError) {
      console.error('[CleanupTokens] Error calling cleanup function:', cleanupError);
      return Response.json(
        { error: 'Failed to cleanup tokens', details: cleanupError.message },
        { status: 500 }
      );
    }

    // Get count of remaining tokens for reporting
    const { count, error: countError } = await supabase
      .from('password_reset_tokens')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.warn('[CleanupTokens] Could not get remaining token count:', countError);
    }

    const result = {
      success: true,
      message: 'Cleanup completed successfully',
      remainingTokens: count || 'unknown',
      timestamp: new Date().toISOString(),
    };

    console.log('[CleanupTokens] Cleanup completed:', result);

    return Response.json(result);

  } catch (error) {
    console.error('[CleanupTokens] Unexpected error:', error);
    return Response.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get statistics about password reset tokens
    const { data: stats, error } = await supabase
      .from('password_reset_tokens')
      .select('used, expires_at, created_at');

    if (error) {
      return Response.json(
        { error: 'Failed to fetch token stats', details: error.message },
        { status: 500 }
      );
    }

    const now = new Date();
    const total = stats.length;
    const expired = stats.filter(token => new Date(token.expires_at) < now).length;
    const used = stats.filter(token => token.used).length;
    const active = stats.filter(token => !token.used && new Date(token.expires_at) >= now).length;

    const result = {
      total,
      active,
      expired,
      used,
      needsCleanup: expired + used,
      timestamp: new Date().toISOString(),
    };

    return Response.json(result);

  } catch (error) {
    console.error('[CleanupTokens] Error fetching stats:', error);
    return Response.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
