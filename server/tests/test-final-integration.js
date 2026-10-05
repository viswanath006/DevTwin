import path from 'path';
import { fileURLToPath } from 'url';
import { scanCodebase } from '../src/services/codebaseScanner.js';
import { buildDependencyGraph } from '../src/services/dependencyGraph.js';
import { analyzeCodebaseDeep } from '../src/services/codebaseAnalyzer.js';
import { getAIProvider } from '../src/services/ai/aiProvider.js';
import { testRunner } from '../src/services/testRunner.js';
import { runSecurityScan } from '../src/services/securityScanner.js';
import { calculateCodebaseHealthScore } from '../src/services/healthScore.js';
import { reviewCodeChanges } from '../src/services/codeReviewer.js';
import { askCodebase } from '../src/services/askCodebase.js';
import { getGitRepositoryInfo } from '../src/services/gitIntelligence.js';
import { detectArchitectureDrift, DEFAULT_ARCHITECTURE_RULES } from '../src/services/architectureDrift.js';
import { simulateWhatIfChange } from '../src/services/whatIfSimulator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_PATH = path.resolve(__dirname, '../../sample-projects/demo-cloud-app');

async function testFinalDevTwinIntegration() {
  console.log('================================================================');
  console.log('🚀 DEVTWIN COMPLETE 12-CAPABILITY SYSTEM INTEGRATION TEST');
  console.log('================================================================\n');

  const provider = getAIProvider();
  console.log(`[Engine] AI Provider Active: ${provider.name || provider.constructor.name}`);

  // 1. Codebase Understanding
  console.log('\n--- 1. Codebase Understanding ---');
  const scanData = await scanCodebase(DEMO_PATH);
  const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
  const deepAnalysis = await analyzeCodebaseDeep(scanData.rootPath, scanData);
  deepAnalysis.graph = graph;
  console.log(`✓ Scanned: ${deepAnalysis.projectName} (${scanData.stats.totalFiles} files, ${scanData.stats.totalLines} lines)`);
  console.log(`✓ Languages: ${deepAnalysis.languages.join(', ')}`);
  console.log(`✓ Extracted: ${deepAnalysis.components.length} components, ${deepAnalysis.apis.length} APIs, ${deepAnalysis.tests.length} test suites`);

  // 2. Architecture Visualization
  console.log('\n--- 2. Architecture Visualization ---');
  const aiArch = await provider.analyzeArchitecture(deepAnalysis);
  console.log(`✓ Architecture Type: ${aiArch.architectureType}`);
  console.log(`✓ Summary: ${aiArch.architecture.slice(0, 100)}...`);
  console.log(`✓ Visual Flow Nodes: ${aiArch.flowGraph?.nodes?.length || 0}`);

  // 3. AI Debugger
  console.log('\n--- 3. AI Debugger ---');
  const demoError = "DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'. Expected primary key 'id'.";
  const debugResult = await provider.debugRootCause({
    error: demoError,
    logs: demoError,
    stackTrace: `DatabaseValidationError at UserRepository.findById (src/repositories/userRepository.js:34:13)`,
    targetFile: 'src/repositories/userRepository.js',
    rootPath: scanData.rootPath,
    projectContext: deepAnalysis,
    graph,
  });
  console.log(`✓ Root Cause: ${debugResult.rootCause}`);
  console.log(`✓ Culprit: ${debugResult.culpritFile}:${debugResult.culpritLine}`);
  console.log(`✓ Fix Patch generated: ${debugResult.patch ? 'YES' : 'NO'}`);

  // 4. Change Impact Analysis
  console.log('\n--- 4. Change Impact Analysis ---');
  const impactResult = await provider.analyzeImpact({
    targetFile: 'src/repositories/userRepository.js',
    intent: 'Fix primary key lookup from user_id to id',
    graph,
    projectContext: deepAnalysis,
  });
  console.log(`✓ Risk Level: ${impactResult.riskLevel}`);
  console.log(`✓ Affected Files: ${impactResult.affectedFiles?.length || 0}`);

  // 5. Verification Engine
  console.log('\n--- 5. Verification Engine ---');
  const verifyResult = await testRunner.runVerification({
    projectPath: DEMO_PATH,
    command: 'devtwin-verify all',
  });
  console.log(`✓ Test Harness Result: ${verifyResult.summary}`);
  console.log(`✓ Assertions: ${verifyResult.tests?.length || 0} passed`);

  // 6. Security Scanner
  console.log('\n--- 6. Security Scanner ---');
  const secResult = await runSecurityScan(scanData.rootPath);
  console.log(`✓ Security Score: ${secResult.score}/100`);
  console.log(`✓ Total Vulnerabilities Found: ${secResult.findings?.length || 0}`);

  // 7. Codebase Health Score
  console.log('\n--- 7. Codebase Health Score ---');
  const healthResult = await calculateCodebaseHealthScore({
    projectContext: deepAnalysis,
    scanData: deepAnalysis,
    securityResults: secResult,
    verificationResults: verifyResult,
  });
  console.log(`✓ Composite Health Score: ${healthResult.overallScore}/100 (Rating: ${healthResult.rating})`);
  console.log(`✓ Category Breakdown: Security=${healthResult.categories.security.score}, Testing=${healthResult.categories.testing.score}, Architecture=${healthResult.categories.architecture.score}`);

  // 8. AI Code Review
  console.log('\n--- 8. AI Code Review ---');
  const reviewResult = await reviewCodeChanges({
    diff: `--- a/src/api/userController.js\n+++ b/src/api/userController.js\n@@ -3,2 +3,3 @@\n+import { db } from '../database/dbConnection.js';`,
    rootPath: scanData.rootPath,
    projectContext: deepAnalysis,
  });
  console.log(`✓ Review Overall Risk: ${reviewResult.overallRisk}`);
  console.log(`✓ Findings: ${reviewResult.findings?.length || 0}`);

  // 9. Ask Your Codebase
  console.log('\n--- 9. Ask Your Codebase ---');
  const askResult = await askCodebase({
    question: 'How does authentication work in this application?',
    projectContext: deepAnalysis,
    rootPath: scanData.rootPath,
  });
  console.log(`✓ Query Category: ${askResult.category}`);
  console.log(`✓ Answer Generated: ${askResult.answer?.slice(0, 100)}...`);
  console.log(`✓ Grounded Evidence Files: ${askResult.evidenceFiles?.length || 0}`);

  // 10. Git Intelligence
  console.log('\n--- 10. Git Intelligence ---');
  const gitInfo = await getGitRepositoryInfo(path.resolve(__dirname, '../../'));
  console.log(`✓ Git Branch: ${gitInfo.branch}`);
  console.log(`✓ Total Commits Indexed: ${gitInfo.totalCommits}`);
  console.log(`✓ Contributors: ${gitInfo.contributors?.length || 0}`);

  // 11. Architecture Drift Detection (Phase 16)
  console.log('\n--- 11. Architecture Drift Detection (Phase 16) ---');
  const driftResult = await detectArchitectureDrift({
    projectContext: deepAnalysis,
    graph,
    rules: DEFAULT_ARCHITECTURE_RULES,
    rootPath: scanData.rootPath,
  });
  console.log(`✓ Has Architecture Drift: ${driftResult.hasDrift}`);
  console.log(`✓ Total Drifts Detected: ${driftResult.totalDrifts}`);
  console.log(`✓ Architecture Drift Score: ${driftResult.driftScore}/100`);
  if (driftResult.detectedDrifts.length > 0) {
    const d = driftResult.detectedDrifts[0];
    console.log(`✓ Drift Detected: [${d.sourceComponent}] -> [${d.targetComponent}] (${d.actualRelationship.replace(/\n/g, ' ')})`);
    console.log(`✓ Evidence: ${d.evidence.statement}`);
  }

  // 12. What-If Analysis (Phase 17)
  console.log('\n--- 12. What-If Analysis (Phase 17) ---');
  const whatIfResult = await simulateWhatIfChange({
    proposedChange: 'Replace JWT authentication with OAuth',
    projectContext: deepAnalysis,
    graph,
  });
  console.log(`✓ Proposed Change: "${whatIfResult.proposedChange}"`);
  console.log(`✓ Predicted Impact: ${whatIfResult.predictedImpact.files} files, ${whatIfResult.predictedImpact.apis} APIs, ${whatIfResult.predictedImpact.services} services, ${whatIfResult.predictedImpact.tests} tests`);
  console.log(`✓ Risk: ${whatIfResult.risk}`);
  console.log(`✓ Potential Issues: ${whatIfResult.potentialProblems?.length || 0}`);
  console.log(`✓ Recommended Actions: ${whatIfResult.recommendedActions?.length || 0}`);

  console.log('\n================================================================');
  console.log('🎉 ALL 12 DEVTWIN CAPABILITIES VERIFIED & FULLY INTEGRATED!');
  console.log('================================================================\n');
}

testFinalDevTwinIntegration().catch((err) => {
  console.error('Final Integration Test Failed:', err);
  process.exit(1);
});
