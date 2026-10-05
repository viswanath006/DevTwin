import path from 'path';
import { fileURLToPath } from 'url';
import { scanCodebase } from './services/codebaseScanner.js';
import { buildDependencyGraph } from './services/dependencyGraph.js';
import { analyzeCodebaseDeep } from './services/codebaseAnalyzer.js';
import { askCodebase } from './services/askCodebase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_PROJECT_PATH = path.resolve(__dirname, '../../sample-projects/demo-cloud-app');

async function runPhase14Verification() {
  console.log('====================================================');
  console.log('🧪 Starting DevTwin Phase 14: "Ask Your Codebase" Verification');
  console.log('====================================================\n');

  // Step 1: Scan and analyze demo project
  console.log(`📂 Indexing sample project: ${DEMO_PROJECT_PATH}`);
  const scanData = await scanCodebase(DEMO_PROJECT_PATH);
  const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
  const deepAnalysis = await analyzeCodebaseDeep(scanData.rootPath, scanData);
  const projectContext = {
    ...deepAnalysis,
    graph,
  };
  console.log(`✓ Indexed ${projectContext.stats?.totalFiles} files and ${projectContext.apis?.length} API endpoints.\n`);

  // Test 1: "How does login work?" / "How does authentication work?"
  console.log('🔍 Test 1: "How does login work?"');
  const res1 = await askCodebase({
    question: 'How does login work?',
    projectContext,
    rootPath: DEMO_PROJECT_PATH,
  });

  console.log('Answer:');
  console.log(res1.answer);
  console.log('Relevant Files:', res1.relevantFiles);
  console.log('Relevant Components:', res1.relevantComponents);
  console.log(`Evidence items count: ${res1.evidence.length}`);

  if (!res1.answer || !res1.answer.includes('↓')) {
    throw new Error('Expected answer to contain step-by-step flow hierarchy with ↓');
  }
  if (!res1.relevantFiles || res1.relevantFiles.length < 2) {
    throw new Error('Expected at least 2 relevant files for authentication flow');
  }
  if (!res1.relevantComponents || res1.relevantComponents.length < 2) {
    throw new Error('Expected relevant components list for authentication flow');
  }
  console.log('✓ Test 1: PASSED\n');

  // Test 2: "Which files depend on UserService?"
  console.log('🔍 Test 2: "Which files depend on UserService?"');
  const res2 = await askCodebase({
    question: 'Which files depend on UserService?',
    projectContext,
    rootPath: DEMO_PROJECT_PATH,
  });

  console.log('Answer:');
  console.log(res2.answer);
  console.log('Relevant Files:', res2.relevantFiles);

  const hasUserController = res2.relevantFiles.some((f) => f.includes('userController'));
  const hasUserTest = res2.relevantFiles.some((f) => f.includes('user.test'));
  console.log(`  userController depends on UserService: ${hasUserController ? 'YES ✓' : 'NO ✗'}`);
  console.log(`  user.test depends on UserService: ${hasUserTest ? 'YES ✓' : 'NO ✗'}`);
  if (!hasUserController && !hasUserTest) {
    throw new Error('Expected either userController or user.test to depend on UserService');
  }
  console.log('✓ Test 2: PASSED\n');

  // Test 3: "Where are errors handled?"
  console.log('🔍 Test 3: "Where are errors handled?"');
  const res3 = await askCodebase({
    question: 'Where are errors handled?',
    projectContext,
    rootPath: DEMO_PROJECT_PATH,
  });

  console.log('Answer:');
  console.log(res3.answer);
  console.log('Relevant Files:', res3.relevantFiles);
  if (!res3.relevantFiles || res3.relevantFiles.length === 0) {
    throw new Error('Expected error handling files to be identified');
  }
  console.log('✓ Test 3: PASSED\n');

  // Test 4: "Which APIs use this database?"
  console.log('🔍 Test 4: "Which APIs use this database?"');
  const res4 = await askCodebase({
    question: 'Which APIs use this database?',
    projectContext,
    rootPath: DEMO_PROJECT_PATH,
  });

  console.log('Answer:');
  console.log(res4.answer);
  console.log('Relevant Files:', res4.relevantFiles);
  if (!res4.answer.includes('API endpoint')) {
    throw new Error('Expected database-consuming APIs to be listed');
  }
  console.log('✓ Test 4: PASSED\n');

  // Test 5: "Which tests cover this component?"
  console.log('🔍 Test 5: "Which tests cover this component?"');
  const res5 = await askCodebase({
    question: 'Which tests cover this component?',
    projectContext,
    rootPath: DEMO_PROJECT_PATH,
  });

  console.log('Answer:');
  console.log(res5.answer);
  console.log('Relevant Files:', res5.relevantFiles);
  if (!res5.relevantFiles || res5.relevantFiles.length === 0) {
    throw new Error('Expected test files to be returned');
  }
  console.log('✓ Test 5: PASSED\n');

  // Test 6: Anti-Hallucination & Grounding Check: entity NOT in the project
  // "How does Stripe billing work?"
  console.log('🔍 Test 6: Anti-Hallucination check for non-existent service ("How does Stripe billing work?")');
  const res6 = await askCodebase({
    question: 'How does Stripe billing work in this project?',
    projectContext,
    rootPath: DEMO_PROJECT_PATH,
  });

  console.log('Answer:');
  console.log(`"${res6.answer}"`);
  if (!res6.answer.includes("I couldn't determine this from the available project context.")) {
    throw new Error(`Expected fallback message "I couldn't determine this from the available project context.", got "${res6.answer}"`);
  }
  console.log('✓ Test 6: Strict Anti-Hallucination PASSED\n');

  // Test 7: Empty project context
  console.log('🔍 Test 7: Empty project context fallback check');
  const res7 = await askCodebase({
    question: 'How does login work?',
    projectContext: null,
  });
  console.log('Answer:');
  console.log(`"${res7.answer}"`);
  if (!res7.answer.includes("I couldn't determine this from the available project context.")) {
    throw new Error('Expected fallback message when no project is loaded');
  }
  console.log('✓ Test 7: Empty context check PASSED\n');

  console.log('====================================================');
  console.log('🎉 Phase 14 "Ask Your Codebase" Verification: ALL 7 TESTS PASSING');
  console.log('====================================================\n');
}

runPhase14Verification().catch((err) => {
  console.error('❌ Phase 14 verification failed:', err);
  process.exit(1);
});
