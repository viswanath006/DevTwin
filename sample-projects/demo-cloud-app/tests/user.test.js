import { userService } from '../src/services/userService.js';

/**
 * User Service Unit & Contract Test Suite
 * Tests profile retrieval and repository layer contracts
 */
export async function testUserProfile() {
  console.log('Running test: should retrieve user profile by ID...');
  try {
    const profile = await userService.getUserProfile('usr_101');
    if (!profile || profile.userId !== 'usr_101') {
      throw new Error(`AssertionError: Expected profile.userId to equal "usr_101", got ${profile?.userId}`);
    }
    console.log('✓ User service test: PASSED');
    return { name: 'User service test', status: 'passed' };
  } catch (err) {
    console.error('✕ User service test: FAILED');
    console.error(`  ${err.message}`);
    return {
      name: 'User service test',
      status: 'failed',
      message: err.message,
    };
  }
}

if (process.argv[1]?.endsWith('user.test.js')) {
  testUserProfile().then((res) => {
    if (res.status === 'failed') process.exit(1);
  });
}
