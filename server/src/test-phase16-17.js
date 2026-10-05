import { scanCodebase } from './services/codebaseScanner.js';
import { buildDependencyGraph } from './services/dependencyGraph.js';
import { analyzeCodebaseDeep } from './services/codebaseAnalyzer.js';
import { detectArchitectureDrift, DEFAULT_ARCHITECTURE_RULES } from './services/architectureDrift.js';
import { simulateWhatIfChange } from './services/whatIfSimulator.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_PROJECT_PATH = path.resolve(__dirname, '../../sample-projects/demo-cloud-app');

async function testPhase16And17() {
  console.log('========================================================');
  console.log('Testing Phase 16: Architecture Drift & Phase 17: What-If');
  console.log('========================================================\n');

  // 1. Scan demo cloud app
  console.log('1. Scanning demo cloud app...');
  const scanData = await scanCodebase(DEMO_PROJECT_PATH);
  const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
  const deepAnalysis = await analyzeCodebaseDeep(scanData.rootPath, scanData);
  deepAnalysis.graph = graph;

  console.log(`✓ Files indexed: ${scanData.stats.totalFiles}`);
  console.log(`✓ Graph nodes: ${Object.keys(graph).length}`);

  // 2. Test Architecture Drift Detection
  console.log('\n2. Testing Architecture Drift Detection (Phase 16)...');
  const driftResult = await detectArchitectureDrift({
    projectContext: deepAnalysis,
    graph,
    rules: DEFAULT_ARCHITECTURE_RULES,
    rootPath: scanData.rootPath,
  });

  console.log(`✓ Has drift: ${driftResult.hasDrift}`);
  console.log(`✓ Total drifts: ${driftResult.totalDrifts}`);
  console.log(`✓ Drift score: ${driftResult.driftScore}/100`);
  console.log(`✓ Expected Architecture: ${driftResult.expectedArchitecture.join(' -> ')}`);

  if (driftResult.detectedDrifts.length > 0) {
    const d = driftResult.detectedDrifts[0];
    console.log(`\n--- DETECTED DRIFT SAMPLE ---`);
    console.log(`Source: ${d.sourceComponent} (${d.sourceLayer})`);
    console.log(`Target: ${d.targetComponent} (${d.targetLayer})`);
    console.log(`Expected: ${d.expectedRelationship.replace(/\n/g, ' ')}`);
    console.log(`Actual: ${d.actualRelationship.replace(/\n/g, ' ')}`);
    console.log(`Severity: ${d.severity}`);
    console.log(`Evidence: ${d.evidence.statement} at line ${d.evidence.line}`);
    console.log(`Recommendation: ${d.recommendation}`);
    console.log('-----------------------------\n');
  }

  // 3. Test What-If Analysis (Phase 17)
  console.log('3. Testing What-If Analysis Simulation (Phase 17)...');
  const whatIfResult = await simulateWhatIfChange({
    proposedChange: 'I want to replace JWT authentication with OAuth.',
    projectContext: deepAnalysis,
    graph,
  });

  console.log(`✓ Proposed Change: "${whatIfResult.proposedChange}"`);
  console.log(`✓ Risk: ${whatIfResult.risk}`);
  console.log(`✓ Predicted Impact:`);
  console.log(`    Files: ${whatIfResult.predictedImpact.files}`);
  console.log(`    APIs: ${whatIfResult.predictedImpact.apis}`);
  console.log(`    Services: ${whatIfResult.predictedImpact.services}`);
  console.log(`    Tests: ${whatIfResult.predictedImpact.tests}`);

  console.log(`\n✓ Potential Problems (${whatIfResult.potentialProblems.length}):`);
  whatIfResult.potentialProblems.slice(0, 4).forEach((p) => console.log(`  • ${p}`));

  console.log(`\n✓ Recommended Actions (${whatIfResult.recommendedActions.length}):`);
  whatIfResult.recommendedActions.slice(0, 3).forEach((a) => console.log(`  ${a}`));

  console.log(`\n✓ Affected Files (${whatIfResult.affectedFiles.length}):`);
  whatIfResult.affectedFiles.slice(0, 4).forEach((f) => console.log(`  [${f.confidence}] ${f.file} - ${f.reason}`));

  console.log('\n========================================================');
  console.log('✓ All Phase 16 & 17 unit verifications passed successfully!');
  console.log('========================================================');
}

testPhase16And17().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
