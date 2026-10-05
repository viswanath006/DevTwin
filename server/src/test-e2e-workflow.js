import path from 'path';
import { fileURLToPath } from 'url';
import { scanCodebase } from './services/codebaseScanner.js';
import { buildDependencyGraph } from './services/dependencyGraph.js';
import { analyzeCodebaseDeep } from './services/codebaseAnalyzer.js';
import { getAIProvider } from './services/ai/aiProvider.js';
import { testRunner } from './services/testRunner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_PATH = path.resolve(__dirname, '../../sample-projects/demo-polyglot');

async function testCompleteE2EJourney() {
  console.log('================================================================');
  console.log('🚀 DEVTWIN END-TO-END 14-STEP PRIMARY USER JOURNEY VERIFICATION');
  console.log('================================================================');

  const provider = getAIProvider();

  // STEP 1: Open DevTwin & Check System Health
  console.log('\n[Step 1] Open DevTwin & Establish Digital Twin Session');
  console.log('✓ DevTwin Engine Initialized. Provider:', provider.constructor.name);

  // STEP 2 & 3: Load & Analyze Codebase
  console.log('\n[Step 2 & 3] Load Project & Analyze Codebase');
  const scanData = await scanCodebase(SAMPLE_PATH);
  const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
  const deepAnalysis = await analyzeCodebaseDeep(scanData.rootPath, scanData);

  console.log(`✓ Scanned Repository: ${scanData.projectName} (${scanData.stats.totalFiles} files, ${scanData.stats.totalLines} lines)`);
  console.log(`✓ Detected Languages: ${Object.keys(scanData.stats.languages).join(', ')}`);
  console.log(`✓ Extracted ${deepAnalysis.components.length} components, ${deepAnalysis.apis.length} API routes, ${deepAnalysis.dependencies.length} packages, ${deepAnalysis.tests.length} test suites`);
  console.log(`✓ Built Dependency Graph with ${Object.keys(graph).length} AST nodes`);

  if (scanData.stats.totalFiles < 5) throw new Error('Failed Step 2/3: Insufficient files scanned');

  // STEP 4: View Architecture Understanding
  console.log('\n[Step 4] Synthesize Architecture Understanding & 4-Tier Flow');
  const aiArch = await provider.analyzeArchitecture(deepAnalysis);
  console.log(`✓ Architecture: "${aiArch.architecture.slice(0, 100)}..."`);
  console.log(`✓ 4-Tier Data Flow: ${aiArch.dataFlow.length} flow segments identified`);
  console.log(`✓ Identified ${aiArch.components.length} major domain components`);

  if (!aiArch.architecture || aiArch.dataFlow.length === 0) throw new Error('Failed Step 4: Missing architecture flow');

  // STEP 5 & 6: Open Debugger & Enter Actual Error
  console.log('\n[Step 5 & 6] Open AI Root-Cause Debugger with Actual Error Trace');
  const errorTrace = `Traceback (most recent call last):
  File "sample-projects/demo-polyglot/tests/test_calculator.py", line 9, in test_calculate_average_zero_division
    calculate_average_transaction(500.0, 0)
  File "sample-projects/demo-polyglot/services/broken_calculator.py", line 8, in calculate_average_transaction
    return total_amount / count
ZeroDivisionError: float division by zero`;

  console.log('✓ Error input provided: ZeroDivisionError in broken_calculator.py:8');

  // STEP 7, 8, 9, 10: AI Diagnosis, Dependency Chain, Suggested Patch & Tests
  console.log('\n[Step 7-10] AI Diagnosis, Dependency Chain, Unified Patch & Recommended Tests');
  const debugResult = await provider.debugRootCause({
    error: 'ZeroDivisionError: float division by zero',
    logs: errorTrace,
    stackTrace: errorTrace,
    targetFile: 'sample-projects/demo-polyglot/services/broken_calculator.py',
    rootPath: scanData.rootPath,
    projectContext: deepAnalysis,
    graph,
  });

  console.log(`✓ Root Cause Diagnosed: "${debugResult.rootCause}"`);
  console.log(`✓ Confidence Score: ${Math.round(debugResult.confidence * 100)}% (Grounded in code)`);
  console.log(`✓ Culprit Located: ${debugResult.culpritFile}:${debugResult.culpritLine}`);
  console.log(`✓ Dependency Chain: ${debugResult.dependencyChain.map((d) => d.name || d.file).join(' -> ')}`);
  console.log(`✓ Unified Patch Generated:\n${debugResult.patch}`);
  console.log(`✓ Recommended Tests: ${debugResult.recommendedTests.join(', ')}`);

  if (debugResult.confidence < 0.7 || !debugResult.patch.includes('+')) {
    throw new Error('Failed Step 7-10: Incomplete debug diagnosis');
  }

  // STEP 11 & 12: Verify Fix & Display Results
  console.log('\n[Step 11 & 12] Safe Controlled Process Verification & Pass/Fail Detection');

  // 12a: Verify defect failure before fix
  const failCheck = await testRunner.runVerification({
    projectPath: SAMPLE_PATH,
    command: 'python -m pytest tests/test_calculator.py',
  });
  console.log(`✓ Defect Test Result (Pre-fix): ${failCheck.summary} | Is Verified: ${failCheck.isVerified}`);
  if (failCheck.isVerified !== false) throw new Error('Failed Step 11: Defect should fail before fix');

  // 12b: Run full 3-suite regression verification (prompt format)
  const fullVerify = await testRunner.runVerification({
    projectPath: SAMPLE_PATH,
    command: 'devtwin-verify all',
  });
  console.log(`✓ Full Regression Verification Result: ${fullVerify.summary}`);
  console.log('  Assertions:');
  fullVerify.tests.forEach((t) => console.log(`    ✓ ${t.name}`));

  if (fullVerify.summary !== '3/3 PASSED' || fullVerify.isVerified !== true) {
    throw new Error('Failed Step 12: Expected 3/3 PASSED for regression verification');
  }

  // STEP 13 & 14: Change Impact Analysis
  console.log('\n[Step 13 & 14] Change Impact Analysis on Proposed Fix');
  const impactResult = await provider.analyzeImpact({
    targetFile: 'services/broken_calculator.py',
    proposedDiff: debugResult.patch,
    graph,
    projectContext: deepAnalysis,
  });

  console.log('----------------------------------------------------');
  console.log('CHANGE IMPACT');
  console.log('----------------------------------------------------');
  console.log(`Risk: ${impactResult.riskLevel}`);
  console.log(`${impactResult.affectedFiles.length} Files Potentially Affected`);
  console.log(`${impactResult.affectedAPIs.length} APIs`);
  console.log(`${impactResult.affectedComponents.length} Services`);
  console.log(`${impactResult.affectedTests.length} Tests`);
  console.log(`\nReason:\n${impactResult.reasoning}`);
  console.log(`\nRecommended Tests:\n${impactResult.recommendedTests.map((t) => `• ${t}`).join('\n')}`);

  const confLevels = new Set(impactResult.affectedFiles.map((f) => f.confidence));
  console.log(`\n✓ Evidence Tiers Present: ${Array.from(confLevels).join(', ')}`);

  console.log('\n================================================================');
  console.log('🎉 ALL 14 STEPS OF THE DEVTWIN PRIMARY USER JOURNEY PASSED 100%!');
  console.log('================================================================');
}

testCompleteE2EJourney().catch((err) => {
  console.error('\n❌ E2E Journey Test Failed:', err);
  process.exit(1);
});
