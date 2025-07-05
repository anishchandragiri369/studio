// Debug API URL generation
import { createApiUrl } from '../src/lib/apiUtils.js';

console.log('Testing API URL generation:');
console.log('API_BASE_URL from env:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('Generated URL:', createApiUrl('/api/referrals/validate'));

// Test the actual call
async function testFrontendCall() {
  try {
    const { apiPost } = await import('../src/lib/apiUtils.js');
    const result = await apiPost('/api/referrals/validate', { 
      referralCode: 'ELIXR8967FF'
    });
    console.log('Frontend call result:', result);
  } catch (error) {
    console.error('Frontend call error:', error);
  }
}

testFrontendCall();
