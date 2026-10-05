import { authService } from '../src/services/authService.js';

/**
 * Authentication Test Suite
 * Tests credential authentication and session token issuance
 */
export async function testAuthentication() {
  console.log('Running test: should authenticate valid user credentials...');
  try {
    const session = await authService.login('alex@devtwin.io', 'secure_password_123');
    if (!session || !session.authenticated || !session.token) {
      throw new Error('AssertionError: Authentication failed to return valid session token.');
    }
    console.log('✓ Authentication test: PASSED');
    return { name: 'Authentication test', status: 'passed' };
  } catch (err) {
    console.error('✕ Authentication test: FAILED');
    console.error(`  ${err.message}`);
    return {
      name: 'Authentication test',
      status: 'failed',
      message: err.message,
    };
  }
}

if (process.argv[1]?.endsWith('auth.test.js')) {
  testAuthentication().then((res) => {
    if (res.status === 'failed') process.exit(1);
  });
}
