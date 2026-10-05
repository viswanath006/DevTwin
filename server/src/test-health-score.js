import path from 'path';
import { fileURLToPath } from 'url';
import { scanCodebase } from './services/codebaseScanner.js';
import { buildDependencyGraph } from './services/dependencyGraph.js';
import { analyzeCodebaseDeep } from './services/codebaseAnalyzer.js';
import { calculateCodebaseHealthScore } from './services/healthScore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testHealthScore() {
  console.log('================================================================');
  console.log('📊 TESTING PHASE 12: CODEBASE HEALTH SCORE ENGINE');
  console.log('================================================================\n');

  // Test 1: demo-polyglot
  const polyglotPath = path.resolve(__dirname, '../../sample-projects/demo-polyglot');
  console.log('--- Test 1: Calculating Health Score for demo-polyglot ---');
  const polyScan = await scanCodebase(polyglotPath);
  const polyGraph = await buildDependencyGraph(polyScan.rootPath, polyScan.stats.fileList);
  const polyContext = await analyzeCodebaseDeep(polyScan.rootPath, polyScan);
  polyContext.graph = polyGraph;

  const polyHealth = await calculateCodebaseHealthScore({
    projectContext: polyContext,
    scanData: polyContext,
  });

  console.log(`CODEBASE HEALTH: ${polyHealth.score} / 100 (${polyHealth.grade} - ${polyHealth.statusText})`);
  console.log('Category Breakdown:');
  console.log(`  Security: ${polyHealth.categories.security.label} (Deduction: -${polyHealth.categories.security.deduction})`);
  console.log(`  Testing: ${polyHealth.categories.testing.label} (Deduction: -${polyHealth.categories.testing.deduction})`);
  console.log(`  Architecture: ${polyHealth.categories.architecture.label} (Deduction: -${polyHealth.categories.architecture.deduction})`);
  console.log(`  Dependencies: ${polyHealth.categories.dependencies.label} (Deduction: -${polyHealth.categories.dependencies.deduction})`);
  console.log(`  Code Quality: ${polyHealth.categories.codeQuality.label} (Deduction: -${polyHealth.categories.codeQuality.deduction})`);

  console.log('\nTop 3 Reasons Affecting Score:');
  polyHealth.topReasons.forEach((r, idx) => {
    console.log(`  ${idx + 1}. [${r.icon}] ${r.text}`);
  });

  if (polyHealth.topReasons.length < 1) {
    throw new Error('Expected at least 1 reason affecting score');
  }

  // Verify non-fabrication: coverageReport must be explicitly marked unavailable
  if (polyHealth.categories.testing.details.coverageReport !== 'unavailable') {
    throw new Error('Coverage report was fabricated instead of marked unavailable!');
  }
  console.log('✓ Verified: Line coverage report is explicitly marked unavailable.');

  // Test 2: demo-cloud-app (with realistic defect scenario)
  console.log('\n--- Test 2: Calculating Health Score for demo-cloud-app (Demo Mode) ---');
  const cloudAppPath = path.resolve(__dirname, '../../sample-projects/demo-cloud-app');
  const cloudScan = await scanCodebase(cloudAppPath);
  const cloudGraph = await buildDependencyGraph(cloudScan.rootPath, cloudScan.stats.fileList);
  const cloudContext = await analyzeCodebaseDeep(cloudScan.rootPath, cloudScan);
  cloudContext.graph = cloudGraph;
  cloudContext.isDemo = true;
  cloudContext.demoScenario = {
    title: '500 Internal Server Error (Database Key Error)',
    targetFile: 'src/repositories/userRepository.js',
  };

  const cloudHealth = await calculateCodebaseHealthScore({
    projectContext: cloudContext,
    scanData: cloudContext,
  });

  console.log(`CODEBASE HEALTH: ${cloudHealth.score} / 100 (${cloudHealth.grade} - ${cloudHealth.statusText})`);
  console.log('Top 3 Reasons:');
  cloudHealth.topReasons.forEach((r, idx) => {
    console.log(`  ${idx + 1}. [${r.icon}] ${r.text}`);
  });

  console.log('\n================================================================');
  console.log('🎉 PHASE 12 HEALTH SCORE BACKEND TEST PASSED 100%!');
  console.log('================================================================');
}

testHealthScore().catch((err) => {
  console.error('Health Score test failed:', err);
  process.exit(1);
});
