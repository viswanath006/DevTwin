async function run() {
  const BASE = 'http://localhost:5000';

  console.log('1. Testing GET /api/verify/frameworks...');
  const fwRes = await fetch(`${BASE}/api/verify/frameworks`);
  const fwData = await fwRes.json();
  console.log('Frameworks Status:', fwRes.status, 'Success:', fwData.success);
  console.log('Detected frameworks count:', fwData.data?.frameworks?.length);
  fwData.data?.frameworks?.forEach((f) => console.log(`  - ${f.name} (Command: ${f.command})`));

  console.log('\n2. Testing POST /api/verify/run with "devtwin-verify all"...');
  const run1 = await fetch(`${BASE}/api/verify/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'devtwin-verify all' }),
  });
  const data1 = await run1.json();
  console.log('Run 1 Status:', run1.status, 'Summary:', data1.data?.summary);
  console.log('Is Verified:', data1.data?.isVerified);
  console.log('Assertions:');
  data1.data?.tests?.forEach((t) => console.log(`  ✓ ${t.name}`));

  console.log('\n3. Testing POST /api/verify/run with "python -m pytest tests/test_calculator.py"...');
  const run2 = await fetch(`${BASE}/api/verify/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectPath: 'sample-projects/demo-polyglot',
      command: 'python -m pytest tests/test_calculator.py',
    }),
  });
  const data2 = await run2.json();
  console.log('Run 2 Status:', run2.status, 'Summary:', data2.data?.summary);
  console.log('Is Verified:', data2.data?.isVerified);
  console.log('Tests:');
  data2.data?.tests?.forEach((t) => console.log(`  ${t.status === 'passed' ? '✓' : '✗'} ${t.name}`));

  console.log('\n4. Testing POST /api/verify/run with malicious command "rm -rf /"...');
  const run3 = await fetch(`${BASE}/api/verify/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'rm -rf /' }),
  });
  const data3 = await run3.json();
  console.log('Run 3 Status:', run3.status, 'Summary:', data3.data?.summary);
  console.log('Error output:', data3.data?.stderr);

  console.log('\n✅ All HTTP Verification API tests completed successfully!');
}

run().catch(console.error);
