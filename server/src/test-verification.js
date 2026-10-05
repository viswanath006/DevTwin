import path from 'path';
import { fileURLToPath } from 'url';
import { testRunner } from './services/testRunner.js';
import { scanCodebase } from './services/codebaseScanner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_PATH = path.resolve(__dirname, '../../sample-projects/demo-polyglot');

async function testVerification() {
  console.log('=== Test 1: Framework Detection ===');
  const scanData = await scanCodebase(SAMPLE_PATH);
  const frameworks = await testRunner.detectFrameworks(SAMPLE_PATH, scanData);
  console.log('Detected Frameworks:', frameworks.map((f) => `${f.name} (${f.command})`));

  // Check expected frameworks
  const fwNames = frameworks.map((f) => f.id);
  if (!fwNames.includes('pytest') || !fwNames.includes('npm') || !fwNames.includes('maven')) {
    throw new Error('Expected pytest, npm, and maven to be detected in demo-polyglot!');
  }

  console.log('\n=== Test 2: Command Validation Security Checks ===');
  const safeCmds = [
    'python -m pytest tests/test_calculator.py',
    'pytest',
    'npm test',
    'npm run test',
    'mvn test',
    'gradle test',
    'devtwin-verify all',
  ];
  for (const c of safeCmds) {
    const val = testRunner.validateCommand(c);
    if (!val.valid) throw new Error(`Safe command rejected: ${c} - ${val.reason}`);
    console.log(`✓ Validated safe command: "${c}"`);
  }

  const maliciousCmds = [
    'rm -rf /',
    'del /f /q C:\\',
    'pytest; cat /etc/passwd',
    'npm test && echo pwned',
    'python -m pytest | grep secret',
    'mvn test `whoami`',
    'powershell Invoke-WebRequest',
    'npm test ../../../secret.txt',
  ];
  for (const m of maliciousCmds) {
    const val = testRunner.validateCommand(m);
    if (val.valid) throw new Error(`DANGEROUS command unexpectedly accepted: "${m}"`);
    console.log(`🛡️ Blocked dangerous command: "${m}" -> ${val.reason}`);
  }

  console.log('\n=== Test 3: Controlled Execution on Failing Defect (tests/test_calculator.py) ===');
  const failRun = await testRunner.runVerification({
    projectPath: SAMPLE_PATH,
    command: 'python -m pytest tests/test_calculator.py',
  });
  console.log('Status:', failRun.status);
  console.log('Is Verified:', failRun.isVerified);
  console.log('Summary:', failRun.summary);
  console.log('Tests parsed:', failRun.tests);
  if (failRun.isVerified !== false || failRun.status !== 'failed') {
    throw new Error('Expected calculator test to FAIL due to known ZeroDivision defect');
  }

  console.log('\n=== Test 4: Controlled Execution on Passing Suite (tests/test_payments.py) ===');
  const passRun = await testRunner.runVerification({
    projectPath: SAMPLE_PATH,
    command: 'python -m pytest tests/test_payments.py',
  });
  console.log('Status:', passRun.status);
  console.log('Is Verified:', passRun.isVerified);
  console.log('Summary:', passRun.summary);
  console.log('Tests parsed:', passRun.tests);
  if (passRun.isVerified !== true || passRun.status !== 'passed') {
    throw new Error('Expected payments test to PASS');
  }

  console.log('\n=== Test 5: Full Regression Suite (devtwin-verify all) ===');
  const fullRun = await testRunner.runVerification({
    projectPath: SAMPLE_PATH,
    command: 'devtwin-verify all',
  });
  console.log('Summary:', fullRun.summary);
  console.log('Tests list:');
  fullRun.tests.forEach((t) => console.log(`  ✓ ${t.name}`));
  if (fullRun.summary !== '3/3 PASSED') {
    throw new Error(`Expected '3/3 PASSED', got '${fullRun.summary}'`);
  }

  console.log('\n✅ All Phase 6 Verification Engine backend tests PASSED successfully!');
}

testVerification().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
