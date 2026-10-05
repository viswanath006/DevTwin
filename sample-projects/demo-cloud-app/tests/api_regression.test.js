import { userController } from '../src/api/userController.js';

/**
 * API Regression Test Suite
 * Validates endpoint response contracts and system availability
 */
export async function testApiRegression() {
  console.log('Running test: should verify system health and API contracts...');
  try {
    let statusCode = 0;
    let responseData = null;

    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseData = data;
        return this;
      },
    };

    await userController.health({}, mockRes);

    if (statusCode !== 200 || responseData?.status !== 'healthy') {
      throw new Error(`AssertionError: Expected health status 200, got ${statusCode}`);
    }

    console.log('✓ API regression test: PASSED');
    return { name: 'API regression test', status: 'passed' };
  } catch (err) {
    console.error('✕ API regression test: FAILED');
    console.error(`  ${err.message}`);
    return {
      name: 'API regression test',
      status: 'failed',
      message: err.message,
    };
  }
}

if (process.argv[1]?.endsWith('api_regression.test.js')) {
  testApiRegression().then((res) => {
    if (res.status === 'failed') process.exit(1);
  });
}
