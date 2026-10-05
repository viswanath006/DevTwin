import path from 'path';
import { fileURLToPath } from 'url';
import { scanCodebase } from '../src/services/codebaseScanner.js';
import { buildDependencyGraph } from '../src/services/dependencyGraph.js';
import { analyzeCodebaseDeep } from '../src/services/codebaseAnalyzer.js';
import { runSecurityScan } from '../src/services/securityScanner.js';
import { getAIProvider } from '../src/services/ai/aiProvider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testSecurityScanner() {
  console.log('================================================================');
  console.log('🛡️  TESTING PHASE 11: AI SECURITY SCANNER');
  console.log('================================================================\n');

  // Test Case 1: demo-polyglot
  const polyglotPath = path.resolve(__dirname, '../../sample-projects/demo-polyglot');
  console.log('--- Test 1: Scanning demo-polyglot codebase ---');
  const polyScan = await scanCodebase(polyglotPath);
  const polyGraph = await buildDependencyGraph(polyScan.rootPath, polyScan.stats.fileList);
  const polyContext = await analyzeCodebaseDeep(polyScan.rootPath, polyScan);

  const polySecurity = await runSecurityScan({
    rootPath: polyScan.rootPath,
    projectContext: polyContext,
    graph: polyGraph,
  });

  console.log(`Score: ${polySecurity.score}/100 (${polySecurity.scoreGrade} - ${polySecurity.scoreStatus})`);
  console.log(`Counts: Critical=${polySecurity.counts.critical}, High=${polySecurity.counts.high}, Medium=${polySecurity.counts.medium}, Low=${polySecurity.counts.low}, Total=${polySecurity.counts.total}`);
  console.log('Findings detected in demo-polyglot:');
  polySecurity.findings.forEach((f, i) => {
    console.log(`  [${i + 1}] [${f.severity}] ${f.title} (${f.file}:${f.line})`);
    console.log(`      Category: ${f.category}`);
    console.log(`      Evidence: ${f.evidence}`);
    console.log(`      Confidence: ${f.confidence}`);
  });

  if (polySecurity.findings.length === 0) {
    throw new Error('Expected findings in demo-polyglot but found 0!');
  }

  // Test Case 2: demo-cloud-app
  console.log('\n--- Test 2: Scanning demo-cloud-app codebase ---');
  const cloudPath = path.resolve(__dirname, '../../sample-projects/demo-cloud-app');
  const cloudScan = await scanCodebase(cloudPath);
  const cloudGraph = await buildDependencyGraph(cloudScan.rootPath, cloudScan.stats.fileList);
  const cloudContext = await analyzeCodebaseDeep(cloudScan.rootPath, cloudScan);

  const cloudSecurity = await runSecurityScan({
    rootPath: cloudScan.rootPath,
    projectContext: cloudContext,
    graph: cloudGraph,
  });

  console.log(`Score: ${cloudSecurity.score}/100 (${cloudSecurity.scoreGrade} - ${cloudSecurity.scoreStatus})`);
  console.log(`Counts: Critical=${cloudSecurity.counts.critical}, High=${cloudSecurity.counts.high}, Medium=${cloudSecurity.counts.medium}, Low=${cloudSecurity.counts.low}, Total=${cloudSecurity.counts.total}`);
  console.log('Findings detected in demo-cloud-app:');
  cloudSecurity.findings.forEach((f, i) => {
    console.log(`  [${i + 1}] [${f.severity}] ${f.title} (${f.file}:${f.line})`);
    console.log(`      Evidence: ${f.evidence}`);
  });

  // Test Case 3: AI Provider Integration
  console.log('\n--- Test 3: Testing AI Provider Enrichment ---');
  const provider = getAIProvider();
  const aiEnrichment = await provider.analyzeSecurity({
    findings: polySecurity.findings,
    projectContext: polyContext,
    score: polySecurity.score,
    counts: polySecurity.counts,
  });
  console.log('AI Threat Posture:', aiEnrichment.threatPosture);
  console.log('AI Summary:', aiEnrichment.summary);

  console.log('\n================================================================');
  console.log('🎉 PHASE 11 SECURITY SCANNER BACKEND TEST PASSED 100%!');
  console.log('================================================================');
}

testSecurityScanner().catch((err) => {
  console.error('Security test failed:', err);
  process.exit(1);
});
