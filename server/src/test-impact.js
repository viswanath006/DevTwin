import path from 'path';
import { fileURLToPath } from 'url';
import { scanCodebase } from './services/codebaseScanner.js';
import { buildDependencyGraph } from './services/dependencyGraph.js';
import { analyzeCodebaseDeep } from './services/codebaseAnalyzer.js';
import { MockAIProvider } from './services/ai/mockProvider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE_PATH = path.resolve(__dirname, '../../sample-projects/demo-polyglot');

async function runTest() {
  console.log('=== Step 1: Scanning demo-polyglot codebase ===');
  const scanData = await scanCodebase(SAMPLE_PATH);
  const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
  const projectContext = await analyzeCodebaseDeep(scanData.rootPath, scanData);

  console.log(`Scanned ${scanData.stats.totalFiles} files. Built graph with ${Object.keys(graph).length} nodes.`);

  const mockProvider = new MockAIProvider();

  // Test Case 1: Sample Git Diff on services/payment_service.py
  console.log('\n=== Test Case 1: Sample Git Diff on services/payment_service.py ===');
  const sampleDiff = `diff --git a/services/payment_service.py b/services/payment_service.py
index a1b2c3d..e4f5g6h 100644
--- a/services/payment_service.py
+++ b/services/payment_service.py
@@ -15,4 +15,7 @@
     def execute_charge(self, payload: PaymentPayload):
-        if payload.amount <= 0:
-            raise ValueError("Amount must be positive")
+        if payload.amount < 5.00:
+            raise ValueError("Minimum charge amount is $5.00")
+        if payload.currency != "USD":
+            raise ValueError("Only USD transactions supported currently")
         return {"status": "success", "tx_id": "tx_998124", "amount": payload.amount}`;

  const diffResult = await mockProvider.analyzeImpact({
    proposedDiff: sampleDiff,
    graph,
    projectContext,
  });

  console.log('Target File Resolved:', diffResult.targetFile);
  console.log('Risk Level:', diffResult.riskLevel);
  console.log('Affected Files Count:', diffResult.affectedFiles.length);
  console.log('Affected Components Count:', diffResult.affectedComponents.length);
  console.log('Affected APIs Count:', diffResult.affectedAPIs.length);
  console.log('Affected Tests Count:', diffResult.affectedTests.length);
  console.log('Reasoning:', diffResult.reasoning);
  console.log('Recommended Tests:', diffResult.recommendedTests);

  // Assert schema
  const requiredKeys = ['riskLevel', 'affectedFiles', 'affectedComponents', 'affectedAPIs', 'affectedTests', 'reasoning', 'recommendedTests'];
  for (const k of requiredKeys) {
    if (diffResult[k] === undefined) {
      throw new Error(`Missing key ${k} in diffResult`);
    }
  }

  // Check confidence tiers
  const confidences = new Set(diffResult.affectedFiles.map((f) => f.confidence));
  console.log('Confidence tiers present in affectedFiles:', Array.from(confidences));

  // Test Case 2: Insufficient evidence guard
  console.log('\n=== Test Case 2: Insufficient Evidence Guard (unknown file) ===');
  const insufficientResult = await mockProvider.analyzeImpact({
    targetFile: 'unknown/non_existent_file.py',
    graph,
    projectContext,
  });
  console.log('Risk Level:', insufficientResult.riskLevel);
  console.log('Reasoning:', insufficientResult.reasoning);

  if (!insufficientResult.reasoning.includes('Insufficient project evidence')) {
    throw new Error('Expected Insufficient project evidence guard to trigger');
  }

  console.log('\n✅ All Phase 5 Impact Analyzer verification tests PASSED successfully!');
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
