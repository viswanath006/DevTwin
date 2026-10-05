import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { runSecurityScan } from '../src/services/securityScanner.js';
import { scanCodebase } from '../src/services/codebaseScanner.js';
import { buildDependencyGraph } from '../src/services/dependencyGraph.js';
import { analyzeCodebaseDeep } from '../src/services/codebaseAnalyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runE2ESecurityValidation() {
  console.log('================================================================');
  console.log('🛡️  PHASE 11: FULL E2E AI SECURITY SCANNER VALIDATION');
  console.log('================================================================\n');

  const polyglotPath = path.resolve(__dirname, '../../sample-projects/demo-polyglot');
  const cloudAppPath = path.resolve(__dirname, '../../sample-projects/demo-cloud-app');

  // 1. Validate demo-polyglot
  console.log('[1/4] Scanning demo-polyglot...');
  const polyScan = await scanCodebase(polyglotPath);
  const polyGraph = await buildDependencyGraph(polyScan.rootPath, polyScan.stats.fileList);
  const polyContext = await analyzeCodebaseDeep(polyScan.rootPath, polyScan);

  const polySecurity = await runSecurityScan({
    rootPath: polyScan.rootPath,
    projectContext: polyContext,
    graph: polyGraph,
  });

  console.log(`✓ Score: ${polySecurity.score}/100 (${polySecurity.scoreGrade} - ${polySecurity.scoreStatus})`);
  console.log(`✓ Critical: ${polySecurity.counts.critical}`);
  console.log(`✓ High: ${polySecurity.counts.high}`);
  console.log(`✓ Medium: ${polySecurity.counts.medium}`);
  console.log(`✓ Low: ${polySecurity.counts.low}`);
  console.log(`✓ Total Findings: ${polySecurity.findings.length}`);

  // 2. Validate Schema Contract
  console.log('\n[2/4] Validating Structured Schema Contracts on all findings...');
  const validSeverities = new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);

  for (const finding of polySecurity.findings) {
    if (!validSeverities.has(finding.severity)) {
      throw new Error(`Invalid severity: "${finding.severity}"`);
    }
    if (!finding.category || typeof finding.category !== 'string') {
      throw new Error(`Missing or invalid category: ${JSON.stringify(finding)}`);
    }
    if (!finding.title || typeof finding.title !== 'string') {
      throw new Error(`Missing or invalid title: ${JSON.stringify(finding)}`);
    }
    if (!finding.description || typeof finding.description !== 'string') {
      throw new Error(`Missing or invalid description: ${JSON.stringify(finding)}`);
    }
    if (!finding.file || typeof finding.file !== 'string') {
      throw new Error(`Missing or invalid file: ${JSON.stringify(finding)}`);
    }
    if (typeof finding.line !== 'number' || finding.line < 1) {
      throw new Error(`Missing or invalid line number: ${JSON.stringify(finding)}`);
    }
    if (!finding.evidence || typeof finding.evidence !== 'string') {
      throw new Error(`Missing or invalid evidence: ${JSON.stringify(finding)}`);
    }
    if (!finding.recommendation || typeof finding.recommendation !== 'string') {
      throw new Error(`Missing or invalid recommendation: ${JSON.stringify(finding)}`);
    }
    if (typeof finding.confidence !== 'number' || finding.confidence <= 0 || finding.confidence > 1) {
      throw new Error(`Missing or invalid confidence: ${JSON.stringify(finding)}`);
    }

    // 3. Verify Code Grounding: Confirm evidence actually exists at file:line!
    const fullFilePath = path.resolve(polyglotPath, finding.file);
    const content = await fs.readFile(fullFilePath, 'utf-8');
    const lines = content.split('\n');
    const actualLine = lines[finding.line - 1];

    if (!actualLine) {
      throw new Error(`Code grounding failure: Line ${finding.line} does not exist in ${finding.file}`);
    }

    // Check that evidence matches
    const trimmedEvidence = finding.evidence.trim();
    const trimmedActual = actualLine.trim();
    if (!trimmedActual.includes(trimmedEvidence) && !trimmedEvidence.includes(trimmedActual)) {
      throw new Error(`Code grounding failure: Evidence "${trimmedEvidence}" does not match file line "${trimmedActual}" in ${finding.file}:${finding.line}`);
    }
    console.log(`  ✓ Grounded in real code: [${finding.severity}] ${finding.file}:${finding.line} -> "${trimmedActual.slice(0, 45)}..."`);
  }

  // 4. Validate demo-cloud-app
  console.log('\n[3/4] Scanning demo-cloud-app...');
  const cloudScan = await scanCodebase(cloudAppPath);
  const cloudGraph = await buildDependencyGraph(cloudScan.rootPath, cloudScan.stats.fileList);
  const cloudContext = await analyzeCodebaseDeep(cloudScan.rootPath, cloudScan);

  const cloudSecurity = await runSecurityScan({
    rootPath: cloudScan.rootPath,
    projectContext: cloudContext,
    graph: cloudGraph,
  });

  console.log(`✓ Score: ${cloudSecurity.score}/100 (${cloudSecurity.scoreGrade} - ${cloudSecurity.scoreStatus})`);
  console.log(`✓ Critical: ${cloudSecurity.counts.critical}`);
  console.log(`✓ High: ${cloudSecurity.counts.high}`);
  console.log(`✓ Medium: ${cloudSecurity.counts.medium}`);
  console.log(`✓ Low: ${cloudSecurity.counts.low}`);

  for (const finding of cloudSecurity.findings) {
    const fullFilePath = path.resolve(cloudAppPath, finding.file);
    const content = await fs.readFile(fullFilePath, 'utf-8');
    const lines = content.split('\n');
    const actualLine = lines[finding.line - 1];
    if (!actualLine) {
      throw new Error(`Code grounding failure in cloud app: Line ${finding.line} does not exist in ${finding.file}`);
    }
    console.log(`  ✓ Grounded in real code: [${finding.severity}] ${finding.file}:${finding.line} -> "${actualLine.trim().slice(0, 45)}..."`);
  }

  // 5. Zero-defect empty state check
  console.log('\n[4/4] Validating clean empty-state behavior...');
  const dummyCleanContext = {
    stats: { totalFiles: 2, fileList: [] },
    dependencies: [],
  };
  const cleanResult = await runSecurityScan({
    rootPath: polyglotPath,
    projectContext: dummyCleanContext,
    graph: {},
  });
  if (cleanResult.score !== 100 || cleanResult.findings.length !== 0 || cleanResult.scoreStatus !== 'SECURE') {
    throw new Error('Clean codebase did not yield 100/100 SECURE score!');
  }
  console.log('✓ Clean state returned Score: 100/100, Status: SECURE, Findings: 0');

  console.log('\n================================================================');
  console.log('🎉 ALL PHASE 11 AI SECURITY SCANNER E2E AUDIT TESTS PASSED!');
  console.log('================================================================');
}

runE2ESecurityValidation().catch((err) => {
  console.error('E2E Security Validation failed:', err);
  process.exit(1);
});
