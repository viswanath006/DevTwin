import { testAuthentication } from './auth.test.js';
import { testUserProfile } from './user.test.js';
import { testApiRegression } from './api_regression.test.js';

/**
 * DevTwin Automated Test Harness Runner
 * Executes all application test suites and outputs structured report
 */
async function runAllTests() {
  console.log('====================================================');
  console.log('Running tests for Demo Cloud App (SaaS Architecture)');
  console.log('====================================================\n');

  const results = [];
  results.push(await testAuthentication());
  results.push(await testUserProfile());
  results.push(await testApiRegression());

  const passed = results.filter((r) => r.status === 'passed').length;
  const total = results.length;

  console.log('\n----------------------------------------------------');
  if (passed === total) {
    console.log(`\n✓ Authentication test\n✓ User service test\n✓ API regression test\n\n${passed}/${total} PASSED\n`);
    process.exit(0);
  } else {
    console.log(`\n${total - passed}/${total} FAILED\n`);
    process.exit(1);
  }
}

runAllTests();
