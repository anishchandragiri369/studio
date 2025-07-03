// Quick debugging script for browser console
// Paste this into the browser console on the reset password page

console.log('=== Password Reset Debug ===');

// Check current URL and hash
console.log('Current URL:', window.location.href);
console.log('URL search:', window.location.search);
console.log('URL hash:', window.location.hash);

// Parse tokens manually
const searchParams = new URLSearchParams(window.location.search);
const hashParams = new URLSearchParams(window.location.hash.substring(1));

console.log('Search params:', Object.fromEntries(searchParams));
console.log('Hash params:', Object.fromEntries(hashParams));

const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
const recoveryToken = searchParams.get('token') || hashParams.get('token');
const type = searchParams.get('type') || hashParams.get('type') || (accessToken ? 'recovery' : null);

console.log('Extracted tokens:');
console.log('- Access Token:', accessToken ? `Present (${accessToken.length} chars)` : 'Missing');
console.log('- Refresh Token:', refreshToken ? `Present (${refreshToken.length} chars)` : 'Missing');
console.log('- Recovery Token:', recoveryToken ? `Present (${recoveryToken.length} chars)` : 'Missing');
console.log('- Type:', type);

// Test Supabase session
if (window.supabase) {
    window.supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.error('Session error:', error);
        } else {
            console.log('Current session:', data.session ? 'Active' : 'None');
            if (data.session) {
                console.log('User ID:', data.session.user?.id);
                console.log('User email:', data.session.user?.email);
            }
        }
    });
}

console.log('=== Debug Complete ===');
