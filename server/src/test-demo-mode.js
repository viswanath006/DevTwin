import path from 'path';
import { fileURLToPath } from 'url';
import { scanCodebase } from './services/codebaseScanner.js';
import { buildDependencyGraph } from './services/dependencyGraph.js';
import { analyzeCodebaseDeep } from './services/codebaseAnalyzer.js';
import { MockAIProvider } from './services/ai/mockProvider.js';
import { testRunner } from './services/testRunner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_PROJECT_PATH = path.resolve(__dirname, '../../sample-projects/demo-cloud-app');

async function runDemoModeVerification() {
  console.log('================================================================');
  console.log('🚀 PHASE 9: DEVTWIN DEMO MODE PRIMARY USER JOURNEY VERIFICATION');
  console.log('================================================================\n');

  const provider = new MockAIProvider();

  // Step 1 & 2: LOAD DEMO PROJECT & ANALYZE
  console.log('[Step 1 & 2] LOAD DEMO PROJECT & ANALYZE CODEBASE');
  const scanData = await scanCodebase(DEMO_PROJECT_PATH);
  const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
  const deepAnalysis = await analyzeCodebaseDeep(scanData.rootPath, scanData);

  console.log(`✓ Scanned Demo Project: ${deepAnalysis.projectName} (${scanData.stats.totalFiles} files, ${scanData.stats.totalLines} lines)`);
  console.log(`✓ Detected Languages: ${Object.keys(scanData.stats.languages).join(', ')}`);
  console.log(`✓ Extracted ${deepAnalysis.components.length} components, ${deepAnalysis.apis.length} APIs, ${deepAnalysis.tests.length} test suites`);
  console.log(`✓ Dependency Graph built with ${Object.keys(graph).length} AST nodes\n`);

  if (deepAnalysis.apis.length === 0) {
    throw new Error('Verification Failure: APIs were not extracted from demo application.');
  }

  // Step 3: ARCHITECTURE GENERATED
  console.log('[Step 3] SYNTHESIZE 4-TIER ARCHITECTURE UNDERSTANDING');
  const aiArch = await provider.analyzeArchitecture(deepAnalysis);
  console.log(`✓ Architecture Pattern: ${aiArch.architectureType}`);
  console.log(`✓ Database Tier: ${aiArch.database?.type} (${aiArch.database?.evidence})`);
  console.log(`✓ Flow Nodes: ${aiArch.flowGraph?.nodes?.map(n => `${n.id} [${n.status}]`).join(' -> ')}\n`);

  // Step 4 & 5: OPEN DEBUGGER & ANALYZE ERROR
  console.log('[Step 4 & 5] OPEN DEBUGGER & ANALYZE REALISTIC 500 DEFECT');
  const demoError = "500 Internal Server Error: DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'. Expected primary key 'id'.";
  const demoLogs = `500 Internal Server Error: DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'. Expected primary key 'id'.
    at UserRepository.findById (src/repositories/userRepository.js:34:13)
    at UserService.getUserProfile (src/services/userService.js:18:38)
    at userController.getUser (src/api/userController.js:19:35)
    at Layer.handle [as handle_request] (express/router/layer.js:95:5)
    at Route.dispatch (express/router/route.js:112:3)`;

  const debugResult = await provider.debugRootCause({
    error: demoError,
    logs: demoLogs,
    stackTrace: demoLogs,
    targetFile: 'src/repositories/userRepository.js',
    rootPath: scanData.rootPath,
    projectContext: deepAnalysis,
    graph,
  });

  // Step 6 & 7: ROOT CAUSE IDENTIFIED & DEPENDENCY CHAIN
  console.log('[Step 6 & 7] ROOT CAUSE IDENTIFIED & DEPENDENCY CHAIN TRACED');
  console.log(`✓ Root Cause: "${debugResult.rootCause}"`);
  console.log(`✓ Confidence Score: ${Math.round(debugResult.confidence * 100)}% (AST Correlated)`);
  console.log(`✓ Culprit Located: ${debugResult.culpritFile}:${debugResult.culpritLine}`);
  console.log('✓ Visual Dependency Chain:');
  debugResult.dependencyChain.forEach(node => {
    console.log(`    [${node.type}] ${node.component} -> ${node.description}`);
  });
  console.log();

  if (!debugResult.culpritFile.includes('userRepository')) {
    throw new Error('Verification Failure: Debugger did not isolate userRepository as culprit.');
  }

  // Step 8: SUGGESTED PATCH
  console.log('[Step 8] SYNTHESIZE SUGGESTED REMEDIATION & UNIFIED PATCH');
  console.log(`✓ Remediation: ${debugResult.suggestedFix}`);
  console.log('✓ Generated Patch:\n' + debugResult.patch + '\n');

  if (!debugResult.patch.includes("['id']")) {
    throw new Error('Verification Failure: Patch did not rectify user_id to id.');
  }

  // Step 9 & 10: VERIFY FIX (Pre-fix Failure & Post-fix Pass)
  console.log('[Step 9 & 10] SAFE CONTROLLED PROCESS VERIFICATION');
  
  // A. Defect verification (demonstrates strict non-verification before fix)
  const preFixResult = await testRunner.runVerification({
    projectPath: scanData.rootPath,
    command: 'devtwin-verify demo-fail',
  });
  console.log(`✓ Pre-Fix Defect Run: ${preFixResult.summary} (Is Verified: ${preFixResult.isVerified})`);
  console.log(`  Output: ${preFixResult.output.split('\n')[0]}`);

  // B. Full regression verification
  const postFixResult = await testRunner.runVerification({
    projectPath: scanData.rootPath,
    command: 'devtwin-verify all',
  });
  console.log(`✓ Post-Fix Full Regression: ${postFixResult.summary} (Is Verified: ${postFixResult.isVerified})`);
  postFixResult.tests.forEach(t => console.log(`  ✓ ${t.name}: ${t.status.toUpperCase()}`));
  console.log();

  if (!postFixResult.isVerified || postFixResult.summary !== '3/3 PASSED') {
    throw new Error('Verification Failure: Post-fix verification did not report 3/3 PASSED.');
  }

  // Step 11: CHANGE IMPACT ANALYSIS
  console.log('[Step 11] CHANGE IMPACT ANALYSIS ON PROPOSED FIX');
  const impactResult = await provider.analyzeImpact({
    targetFile: 'src/repositories/userRepository.js',
    proposedDiff: debugResult.patch,
    graph,
    projectContext: deepAnalysis,
  });

  console.log(`✓ Risk Level: ${impactResult.riskLevel}`);
  console.log(`✓ Affected Files (${impactResult.affectedFiles.length}): ${impactResult.affectedFiles.map(f => typeof f === 'object' ? f.file : f).slice(0, 4).join(', ')}...`);
  console.log(`✓ Affected Components (${impactResult.affectedComponents.length}): ${impactResult.affectedComponents.map(c => c.name).join(', ')}`);
  console.log(`✓ Affected APIs (${impactResult.affectedAPIs.length}): ${impactResult.affectedAPIs.map(a => `${a.method} ${a.path}`).join(', ')}`);
  console.log(`✓ Affected Tests (${impactResult.affectedTests.length}): ${impactResult.affectedTests.map(t => typeof t === 'object' ? t.file : t).join(', ')}`);
  console.log(`✓ Recommended Action: ${impactResult.recommendedAction}`);
  console.log();

  console.log('================================================================');
  console.log('🎉 PHASE 9 DEMO MODE VERIFICATION PASSED 100% SUCCESSFULLY!');
  console.log('================================================================\n');
}

runDemoModeVerification().catch(err => {
  console.error('\n❌ DEMO MODE VERIFICATION FAILED:', err);
  process.exit(1);
});
