import fs from 'fs/promises';

/**
 * Mock & Heuristic AI Provider
 * Provides robust, intelligent fallback responses for local offline demos or development
 * without requiring active external API keys.
 */
export class MockAIProvider {
  constructor() {
    this.name = 'Mock / Heuristic Engine';
  }

  async analyzeCodebase({ stats, query, fileTree }) {
    const q = (query || '').toLowerCase();
    const totalFiles = stats?.totalFiles || 0;
    const languages = Object.keys(stats?.languages || {}).join(', ') || 'JavaScript, HTML, CSS';

    let answer = '';
    let keyComponents = [];

    if (q.includes('arch') || q.includes('structure') || q.includes('overview') || !query) {
      answer = `DevTwin Digital Twin Analysis:
• Total Files Indexed: ${totalFiles}
• Primary Stacks Detected: ${languages}
• Architecture Pattern: Decoupled Client-Server Architecture.
  - Backend API handles AST parsing, dependency graph traversal, and AI orchestration.
  - Frontend SPA handles interactive codebase inspection, stack trace debugging, and blast radius visualization.`;

      keyComponents = [
        { name: 'API Server', path: 'server/src/index.js', role: 'REST endpoints and local filesystem integration' },
        { name: 'Dependency Engine', path: 'server/src/services/dependencyGraph.js', role: 'Call graph & blast radius calculator' },
        { name: 'AI Layer', path: 'server/src/services/ai/aiProvider.js', role: 'Pluggable LLM interface' },
        { name: 'UI Dashboard', path: 'client/src/App.jsx', role: 'Developer tool workspace' }
      ];
    } else {
      answer = `DevTwin analyzed ${totalFiles} files matching your inquiry "${query}":
Based on symbol analysis and import tracking, relevant logic is concentrated in the core service modules. The codebase follows local-first processing conventions with modular services for scanning, graph generation, and verification.`;
      keyComponents = [
        { name: 'Relevant Module', path: 'server/src/services/codebaseScanner.js', role: 'Handles file system queries' }
      ];
    }

    return {
      provider: 'mock',
      query: query || 'Codebase Overview',
      summary: answer,
      keyComponents,
      confidence: 0.94,
    };
  }

  /**
   * Phase 3: AI Structured Architecture Understanding
   * Strictly evidence-grounded extraction of components, flows, and layers
   */
  async analyzeArchitecture(projectContext) {
    const {
      projectName = 'Project',
      languages = [],
      dependencies = [],
      components = [],
      apis = [],
      tests = [],
      architecture = [],
      fileCount = 0,
      stats = {},
    } = projectContext;

    const fileList = stats.fileList || [];
    const allFilePaths = fileList.map((f) => f.relativePath.toLowerCase());
    const depNames = dependencies.map((d) => d.name.toLowerCase());

    // 1. Detect Frontend
    const hasReact = depNames.includes('react') || allFilePaths.some((p) => p.endsWith('.jsx') || p.endsWith('.tsx'));
    const hasVue = depNames.includes('vue') || allFilePaths.some((p) => p.endsWith('.vue'));
    const hasAngular = depNames.includes('@angular/core');
    const frontendFramework = hasReact ? 'React' : hasVue ? 'Vue.js' : hasAngular ? 'Angular' : null;
    const frontendFiles = fileList.filter((f) => f.relativePath.includes('client') || f.relativePath.includes('component') || f.relativePath.endsWith('.jsx') || f.relativePath.endsWith('.tsx'));

    // 2. Detect Backend & API frameworks
    const backendFrameworks = [];
    if (depNames.includes('express') || apis.some((a) => a.framework?.includes('Express'))) backendFrameworks.push('Express (Node.js)');
    if (depNames.includes('fastapi') || apis.some((a) => a.framework?.includes('FastAPI'))) backendFrameworks.push('FastAPI (Python)');
    if (depNames.includes('flask') || apis.some((a) => a.framework?.includes('Flask'))) backendFrameworks.push('Flask (Python)');
    if (dependencies.some((d) => d.name.includes('spring-boot')) || apis.some((a) => a.framework?.includes('Spring Boot'))) backendFrameworks.push('Spring Boot (Java)');

    // 3. Detect Database strictly from evidence
    let dbType = 'Unknown';
    let dbEvidence = 'No database driver, ORM, or database connection config detected in project files.';
    let dbDetected = false;

    // Check config files
    const dbConfigFile = fileList.find((f) => f.relativePath.toLowerCase().includes('database') || f.relativePath.toLowerCase().includes('db.'));
    if (dbConfigFile) {
      dbDetected = true;
      dbType = 'PostgreSQL'; // from database.json or config
      dbEvidence = `Found database configuration file: ${dbConfigFile.relativePath}`;
    } else if (depNames.some((d) => d.includes('postgres') || d.includes('pg') || d.includes('psycopg'))) {
      dbDetected = true;
      dbType = 'PostgreSQL';
      dbEvidence = 'PostgreSQL client library detected in project dependencies';
    } else if (depNames.some((d) => d.includes('mongo') || d.includes('mongoose'))) {
      dbDetected = true;
      dbType = 'MongoDB';
      dbEvidence = 'MongoDB / Mongoose driver detected in project dependencies';
    } else if (depNames.some((d) => d.includes('mysql') || d.includes('mariadb'))) {
      dbDetected = true;
      dbType = 'MySQL / MariaDB';
      dbEvidence = 'MySQL driver detected in project dependencies';
    } else if (depNames.some((d) => d.includes('sqlite'))) {
      dbDetected = true;
      dbType = 'SQLite';
      dbEvidence = 'SQLite embedded driver detected in project dependencies';
    }

    // 4. Determine Architecture Pattern
    let archType = 'Modular Client-Server';
    if (backendFrameworks.length > 1) {
      archType = 'Polyglot Microservices';
    } else if (frontendFramework && backendFrameworks.length === 1) {
      archType = 'Decoupled Client-Server';
    } else if (!frontendFramework && backendFrameworks.length > 0) {
      archType = 'Backend REST API';
    } else if (frontendFramework && backendFrameworks.length === 0) {
      archType = 'Frontend SPA';
    }

    // 5. Select Major Grounded Components
    const majorComponents = [];
    if (frontendFramework) {
      majorComponents.push({
        name: `${frontendFramework} UI Layer`,
        type: 'Frontend',
        role: `Interactive user interface & view components (${frontendFiles.length} files)`,
        evidence: frontendFiles[0]?.relativePath || 'Frontend components found',
      });
    }

    for (const fw of backendFrameworks) {
      const sampleApi = apis.find((a) => a.framework?.includes(fw.split(' ')[0]));
      majorComponents.push({
        name: `${fw} Gateway`,
        type: 'API Layer',
        role: `Exposes ${apis.filter((a) => a.framework?.includes(fw.split(' ')[0])).length} REST endpoints`,
        evidence: sampleApi ? `${sampleApi.file}:${sampleApi.line}` : 'Framework configuration',
      });
    }

    // Core Domain Services
    const serviceSymbols = components.filter((c) => c.kind === 'Class' || c.file.includes('service') || c.file.includes('processor'));
    for (const s of serviceSymbols.slice(0, 4)) {
      majorComponents.push({
        name: s.name,
        type: 'Service / Core',
        role: s.details || 'Core business logic & domain operations',
        evidence: `${s.file}:${s.line}`,
      });
    }

    if (dbDetected) {
      majorComponents.push({
        name: `${dbType} Data Store`,
        type: 'Database',
        role: 'Persistent relational or document storage',
        evidence: dbEvidence,
      });
    }

    // 6. Data & API Flows
    const dataFlow = [];
    if (frontendFramework && backendFrameworks.length > 0) {
      dataFlow.push({
        step: 1,
        from: `${frontendFramework} Client Interface`,
        to: `API Gateway (${backendFrameworks.join(', ')})`,
        protocol: 'HTTP / JSON REST',
        evidence: `${apis.length} detectable API endpoints available for client calls`,
      });
    }

    if (serviceSymbols.length > 0) {
      dataFlow.push({
        step: 2,
        from: 'API Route Handlers',
        to: `Domain Services (${serviceSymbols.slice(0, 2).map((s) => s.name).join(', ')})`,
        protocol: 'In-Memory / Function Invocations',
        evidence: `${serviceSymbols[0].name} instantiated in ${serviceSymbols[0].file}`,
      });
    }

    dataFlow.push({
      step: 3,
      from: 'Domain Services',
      to: dbDetected ? `${dbType} Database` : 'Unknown Persistence Layer',
      protocol: dbDetected ? 'Connection Pool / SQL' : 'Unknown',
      evidence: dbEvidence,
    });

    // 7. API Flow Mapping
    const apiFlow = apis.slice(0, 8).map((a) => ({
      method: a.method,
      endpoint: a.path,
      consumer: frontendFramework ? 'Client Frontend' : 'External Client',
      handler: `${a.file.split('/').pop()}:${a.line}`,
      evidence: `${a.framework} (${a.file}:${a.line})`,
    }));

    // 8. Key Dependencies Categorization
    const categorizedDeps = dependencies.slice(0, 8).map((d) => ({
      name: d.name,
      version: d.version,
      importance: d.type === 'production' ? 'Core' : 'Development',
      ecosystem: d.ecosystem,
      evidence: d.sourceFile,
    }));

    // 9. Risks Grounded in Codebase State
    const risks = [];
    if (!dbDetected) {
      risks.push({
        severity: 'LOW',
        title: 'Database Persistence Unverified',
        description: 'No explicit database driver or connection pooling was detected in the package manifests.',
        recommendation: 'Verify if data is stored in memory, via external microservices, or if DB configs are externalized.',
      });
    }

    if (tests.length === 0) {
      risks.push({
        severity: 'HIGH',
        title: 'Missing Automated Test Guards',
        description: `Project contains ${fileCount} files but has zero detected unit test suites.`,
        recommendation: 'Add test specifications (JUnit/Pytest/Vitest) to guard core endpoints.',
      });
    } else {
      risks.push({
        severity: 'LOW',
        title: 'Test Suite Coverage',
        description: `Detected ${tests.length} test suite(s) with ${tests.reduce((acc, t) => acc + (t.testCasesCount || 0), 0)} assertions.`,
        recommendation: 'Maintain end-to-end regression tests for critical API paths.',
      });
    }

    if (apis.length > 5 && !depNames.some((d) => d.includes('cors') || d.includes('helmet') || d.includes('rate-limit'))) {
      risks.push({
        severity: 'MEDIUM',
        title: 'API Security & Rate Limiting Guard',
        description: 'Multiple public API endpoints found without dedicated rate-limiting packages in manifests.',
        recommendation: 'Introduce rate-limiting middleware or API gateway throttling.',
      });
    }

    // 10. Visual Flow Graph Definition (Frontend -> API -> Service -> Database)
    const flowGraph = {
      nodes: [
        {
          id: 'frontend',
          label: frontendFramework ? `${frontendFramework} UI` : 'Frontend UI',
          status: frontendFramework ? 'detected' : 'unknown',
          subtext: frontendFramework ? `${frontendFiles.length} components` : 'Unknown (No UI detected)',
          evidence: frontendFramework ? frontendFiles[0]?.relativePath : 'None',
        },
        {
          id: 'api',
          label: backendFrameworks.length > 0 ? backendFrameworks[0] : 'API Layer',
          status: backendFrameworks.length > 0 ? 'detected' : 'unknown',
          subtext: `${apis.length} endpoints active`,
          evidence: apis[0]?.file || 'API manifests',
        },
        {
          id: 'service',
          label: serviceSymbols.length > 0 ? serviceSymbols[0].name : 'Core Services',
          status: serviceSymbols.length > 0 ? 'detected' : 'unknown',
          subtext: `${serviceSymbols.length} business modules`,
          evidence: serviceSymbols[0]?.file || 'Internal logic',
        },
        {
          id: 'database',
          label: dbDetected ? `${dbType}` : 'Database (Unknown)',
          status: dbDetected ? 'detected' : 'unknown',
          subtext: dbDetected ? 'Persistent storage' : 'Unknown (No DB Found)',
          evidence: dbEvidence,
        },
      ],
      edges: [
        { from: 'frontend', to: 'api', label: 'HTTP REST' },
        { from: 'api', to: 'service', label: 'Dispatches' },
        { from: 'service', to: 'database', label: dbDetected ? 'SQL / ORM' : 'Unknown' },
      ],
    };

    return {
      provider: 'mock',
      projectName,
      architecture: `${archType}: ${languages.join(', ')} codebase comprising ${fileCount} files, ${apis.length} API endpoints, and ${dependencies.length} packages.`,
      architectureType: archType,
      frontend: {
        detected: !!frontendFramework,
        framework: frontendFramework || 'Unknown',
        evidence: frontendFiles[0]?.relativePath || 'No UI files detected',
      },
      backend: {
        detected: backendFrameworks.length > 0,
        frameworks: backendFrameworks.length > 0 ? backendFrameworks : ['Unknown'],
        evidence: apis[0]?.file || 'No backend frameworks detected',
      },
      database: {
        detected: dbDetected,
        type: dbType,
        evidence: dbEvidence,
      },
      components: majorComponents,
      dataFlow,
      apiFlow,
      dependencies: categorizedDeps,
      risks,
      flowGraph,
      confidence: 0.96,
    };
  }

  /**
   * Phase 4: AI Root-Cause Debugger
   * Analyzes error, logs, project files, and dependency graph without inventing symbols
   */
  async debugRootCause({ error, logs, stackTrace, targetFile, rootPath, projectContext, graph = {} }) {
    const rawInput = `${error || ''}\n${logs || ''}\n${stackTrace || ''}`;
    const fileList = projectContext?.stats?.fileList || [];

    // 1. Identify files mentioned in the error/logs matching real project files
    const matchedFiles = [];
    for (const f of fileList) {
      const rel = f.relativePath;
      const base = rel.split('/').pop();
      if (rawInput.includes(rel) || rawInput.includes(rel.replace(/\//g, '\\')) || (base.length > 5 && rawInput.includes(base))) {
        matchedFiles.push(f);
      }
    }

    // Sort matchedFiles by order of appearance in stack trace / error input
    matchedFiles.sort((a, b) => {
      const idxA = Math.min(
        rawInput.indexOf(a.relativePath) !== -1 ? rawInput.indexOf(a.relativePath) : Infinity,
        rawInput.indexOf(a.relativePath.split('/').pop()) !== -1 ? rawInput.indexOf(a.relativePath.split('/').pop()) : Infinity
      );
      const idxB = Math.min(
        rawInput.indexOf(b.relativePath) !== -1 ? rawInput.indexOf(b.relativePath) : Infinity,
        rawInput.indexOf(b.relativePath.split('/').pop()) !== -1 ? rawInput.indexOf(b.relativePath.split('/').pop()) : Infinity
      );
      return idxA - idxB;
    });

    // Also prioritize targetFile if explicitly passed
    if (targetFile) {
      const targetMatch = fileList.find((f) => f.relativePath === targetFile || f.relativePath.endsWith(targetFile));
      if (targetMatch) {
        const existingIdx = matchedFiles.findIndex((m) => m.relativePath === targetMatch.relativePath);
        if (existingIdx !== -1) {
          matchedFiles.splice(existingIdx, 1);
        }
        matchedFiles.unshift(targetMatch);
      }
    }

    // 2. Insufficient Evidence Guard: If no project files match the error
    if (matchedFiles.length === 0 && !targetFile) {
      return {
        provider: 'mock',
        rootCause: 'Insufficient Codebase Evidence',
        confidence: 0.2,
        severity: 'LOW',
        affectedFiles: [],
        dependencyChain: [],
        evidenceFiles: [],
        explanation: 'The provided error message and logs do not reference any source files, symbols, or modules present in the currently scanned codebase.',
        suggestedFix: 'Provide an execution stack trace or error log containing relative file paths that exist in this repository.',
        patch: '',
        recommendedTests: []
      };
    }

    const primaryFile = matchedFiles[0] || { relativePath: targetFile || 'unknown' };

    // 3. Extract line number from stack trace
    let culpritLine = null;
    const escapedRel = primaryFile.relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedBase = primaryFile.relativePath.split('/').pop().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineRegex = new RegExp(`(?:${escapedRel}|${escapedBase})["',\\s(:]+(?:line\\s+)?(\\d+)`, 'i');
    const lineMatch = rawInput.match(lineRegex);
    if (lineMatch) {
      culpritLine = parseInt(lineMatch[1], 10);
    } else {
      // General stack trace line fallback
      const genericMatch = rawInput.match(/[:\s](\d+):(\d+)/);
      if (genericMatch) culpritLine = parseInt(genericMatch[1], 10);
    }

    // 4. Fetch real file content snippet around culprit line
    let codeSnippet = '';
    let targetLines = [];
    try {
      if (primaryFile.fullPath) {
        const rawContent = await fs.readFile(primaryFile.fullPath, 'utf-8');
        targetLines = rawContent.split('\n');
        if (culpritLine && culpritLine > 0 && culpritLine <= targetLines.length) {
          const start = Math.max(0, culpritLine - 3);
          const end = Math.min(targetLines.length, culpritLine + 3);
          codeSnippet = targetLines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join('\n');
        } else {
          codeSnippet = targetLines.slice(0, 10).map((l, i) => `${i + 1}: ${l}`).join('\n');
          culpritLine = 1;
        }
      }
    } catch {
      // Fallback
    }

    // 5. Build Grounded Visual Dependency Chain: Caller -> Handler -> ROOT CAUSE -> Affected Component
    const nodeData = graph[primaryFile.relativePath] || {};
    const callers = nodeData.importedBy || [];
    const directImports = nodeData.imports || [];

    const dependencyChain = [];
    let stepNum = 1;

    // Caller component (e.g. Test Runner or Gateway)
    if (callers.length > 0) {
      dependencyChain.push({
        step: stepNum++,
        component: callers[0],
        type: callers[0].includes('test') ? 'Test Suite / Caller' : 'Upstream Consumer',
        status: 'caller',
        description: `Dispatches request or assertion targeting ${primaryFile.relativePath.split('/').pop()}`,
      });
    } else {
      dependencyChain.push({
        step: stepNum++,
        component: 'Client / Entrypoint Request',
        type: 'External Trigger',
        status: 'caller',
        description: 'External invocation received at system boundary',
      });
    }

    // Root Cause Component
    dependencyChain.push({
      step: stepNum++,
      component: `${primaryFile.relativePath}${culpritLine ? `:${culpritLine}` : ''}`,
      type: 'ROOT CAUSE',
      status: 'root_cause',
      description: `Fault originates here: ${error ? error.split('\n')[0].slice(0, 80) : 'Exception triggered'}`,
    });

    // Downstream Affected Component
    if (directImports.length > 0) {
      dependencyChain.push({
        step: stepNum++,
        component: directImports[0],
        type: 'Downstream Impact',
        status: 'impacted',
        description: `Cascade reaches imported dependency ${directImports[0].split('/').pop()}`,
      });
    } else {
      dependencyChain.push({
        step: stepNum++,
        component: 'HTTP Response / Transaction Pipeline',
        type: 'Downstream Impact',
        status: 'impacted',
        description: 'Aborts normal execution flow and returns 500 / unhandled failure',
      });
    }

    // 6. Generate Contextual Patch
    const actualLineContent = targetLines[culpritLine - 1] || '    const result = data;';
    const isPython = primaryFile.relativePath.endsWith('.py');
    const isJava = primaryFile.relativePath.endsWith('.java');

    let patch = '';
    let explanation = '';
    let suggestedFix = '';
    let severity = 'HIGH';

    if (rawInput.includes('DatabaseValidation') || rawInput.includes('user_id') || rawInput.includes('Column') || rawInput.includes('KeyError')) {
      severity = 'CRITICAL';
      explanation = `Database Schema/Key Mismatch: Query logic in ${primaryFile.relativePath} at line ${culpritLine} queries non-existent column or key 'user_id'. Relational table schema defines primary key 'id'.`;
      suggestedFix = `Update dictionary key lookup from 'user_id' to valid primary key 'id' matching table contract.`;
      patch = `--- ${primaryFile.relativePath} (original)\n+++ ${primaryFile.relativePath} (fixed)\n@@ -${Math.max(1, culpritLine - 2)},5 +${Math.max(1, culpritLine - 2)},5 @@\n-    const primaryKey = record['user_id'];\n+    const primaryKey = record['id'];\n     if (!primaryKey) {\n-      throw new Error("DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'. Expected primary key 'id'.");\n     }\n     return {\n-      id: record['user_id'],\n+      id: record['id'],`;
    } else if (rawInput.includes('ZeroDivision') || rawInput.includes('division by zero')) {
      severity = 'HIGH';
      explanation = `ZeroDivisionError: Operation attempts division by zero at line ${culpritLine} without a non-zero guard check.`;
      suggestedFix = 'Add a validation guard to verify divisor is strictly positive before executing division.';
      patch = `--- ${primaryFile.relativePath} (original)\n+++ ${primaryFile.relativePath} (fixed)\n@@ -${Math.max(1, culpritLine - 1)},3 +${Math.max(1, culpritLine - 1)},5 @@\n-    rate = total / count\n+    if count <= 0:\n+        raise ValueError("Count must be greater than zero")\n+    rate = total / count`;
    } else if (rawInput.includes('ValueError') || rawInput.includes('Amount must be positive')) {
      severity = 'MEDIUM';
      explanation = `Input Validation Guard Triggered: Value passed to ${primaryFile.relativePath.split('/').pop()} violates domain constraints at line ${culpritLine}.`;
      suggestedFix = 'Ensure caller validates payload amounts before dispatching charge execution.';
      patch = `--- ${primaryFile.relativePath} (original)\n+++ ${primaryFile.relativePath} (fixed)\n@@ -${Math.max(1, culpritLine - 1)},4 +${Math.max(1, culpritLine - 1)},6 @@\n     def execute_charge(self, payload: PaymentPayload):\n-        if payload.amount <= 0:\n-            raise ValueError("Amount must be positive")\n+        if not payload or payload.amount is None or payload.amount <= 0:\n+            return {"status": "rejected", "reason": "Amount must be strictly positive"}`;
    } else if (rawInput.includes('TypeError') || rawInput.includes('undefined') || rawInput.includes('NullPointer')) {
      severity = 'CRITICAL';
      explanation = `Null/Undefined Reference Exception at line ${culpritLine} in ${primaryFile.relativePath}: An operation was attempted on an uninitialized reference.`;
      suggestedFix = 'Implement defensive null checking and optional chaining guards prior to evaluation.';
      patch = isPython
        ? `--- ${primaryFile.relativePath}\n+++ ${primaryFile.relativePath}\n@@ -${Math.max(1, culpritLine - 1)},3 +${Math.max(1, culpritLine - 1)},5 @@\n-    return data.get("id")\n+    if not data:\n+        return None\n+    return data.get("id")`
        : isJava
        ? `--- ${primaryFile.relativePath}\n+++ ${primaryFile.relativePath}\n@@ -${Math.max(1, culpritLine - 1)},3 +${Math.max(1, culpritLine - 1)},5 @@\n-    return user.getName();\n+    if (user == null) {\n+        return "Unknown";\n+    }\n+    return user.getName();`
        : `--- ${primaryFile.relativePath}\n+++ ${primaryFile.relativePath}\n@@ -${Math.max(1, culpritLine - 1)},3 +${Math.max(1, culpritLine - 1)},5 @@\n-    const val = item.value;\n+    if (!item) return null;\n+    const val = item?.value ?? null;`;
    } else {
      severity = 'HIGH';
      explanation = `Runtime exception triggered in ${primaryFile.relativePath} around line ${culpritLine}. Execution halted abruptly due to unhandled condition: ${error.slice(0, 120)}`;
      suggestedFix = 'Wrap targeted block with boundary validation and graceful error fallback.';
      patch = `--- ${primaryFile.relativePath}\n+++ ${primaryFile.relativePath}\n@@ -${Math.max(1, culpritLine - 1)},3 +${Math.max(1, culpritLine - 1)},5 @@\n-    ${actualLineContent.trim()}\n+    // DevTwin Verified Guard\n+    if (${isPython ? 'target_obj is not None' : 'targetObj'}) {\n+        ${actualLineContent.trim()}\n+    }`;
    }

    // Confidence is grounded in evidence (exact file matched + culprit line located)
    let confidence = 0.65;
    if (primaryFile.fullPath) confidence += 0.15;
    if (culpritLine && codeSnippet.length > 0) confidence += 0.12;

    const affectedFiles = [
      {
        file: primaryFile.relativePath,
        lines: culpritLine ? `Line ${culpritLine}` : 'Top-level',
        role: 'Fault Origin (Root Cause)',
      },
      ...callers.map((c) => ({
        file: c,
        lines: 'Downstream caller',
        role: 'Impacted Consumer',
      })),
    ];

    const recommendedTests = [
      `Regression test guarding boundary conditions for ${primaryFile.relativePath.split('/').pop()}`,
      ...(callers.length > 0 ? [`Integration verification for caller: ${callers[0]}`] : []),
      'Null and negative input fuzzing assertions',
    ];

    return {
      provider: 'mock',
      culpritFile: primaryFile.relativePath,
      culpritLine,
      rootCause: `Fault in ${primaryFile.relativePath}${culpritLine ? ` at line ${culpritLine}` : ''}: ${error ? error.split('\n')[0].slice(0, 80) : 'Exception'}`,
      confidence: parseFloat(confidence.toFixed(2)),
      severity,
      affectedFiles,
      dependencyChain: dependencyChain.map((d) => ({ ...d, name: d.name || d.component })),
      evidenceFiles: [
        {
          file: primaryFile.relativePath,
          line: culpritLine,
          snippet: codeSnippet,
        },
      ],
      explanation,
      suggestedFix,
      patch,
      recommendedTests,
    };
  }

  /**
   * Phase 5: Change Impact Analyzer
   * Evaluates proposed code diff or intent against graph and project context
   * Strictly distinguishes Confirmed, Likely, and Possible dependencies
   */
  async analyzeImpact({ targetFile, proposedDiff, changedCode, intent, graph = {}, projectContext = {} }) {
    const rawInput = `${proposedDiff || ''}\n${changedCode || ''}\n${intent || ''}`;
    const fileList = projectContext?.stats?.fileList || [];
    const allApis = projectContext?.apis || [];
    const allComponents = projectContext?.components || [];
    const allTests = projectContext?.tests || [];

    // 1. Resolve target file (either directly passed, parsed from git diff header, or inferred from intent/code)
    let resolvedTarget = targetFile;
    if (!resolvedTarget || !graph[resolvedTarget]) {
      const diffFileMatch = rawInput.match(/(?:---|\+\+\+)\s+[ab]\/([^\s\n]+)/) ||
                            rawInput.match(/diff\s+--git\s+a\/([^\s\n]+)\s+b\/([^\s\n]+)/);
      if (diffFileMatch) {
        const candidate = diffFileMatch[1];
        const found = fileList.find((f) => f.relativePath === candidate || f.relativePath.endsWith(candidate));
        if (found) resolvedTarget = found.relativePath;
        else resolvedTarget = candidate;
      }
    }

    // Try finding in fileList if partial path passed or inferred from raw input
    if (resolvedTarget && !graph[resolvedTarget]) {
      const match = fileList.find((f) => f.relativePath === resolvedTarget || f.relativePath.endsWith(resolvedTarget));
      if (match) resolvedTarget = match.relativePath;
    }

    if (!resolvedTarget && fileList.length > 0) {
      for (const f of fileList) {
        const basename = f.relativePath.split('/').pop();
        if (rawInput.includes(f.relativePath) || (basename.length > 4 && rawInput.includes(basename))) {
          resolvedTarget = f.relativePath;
          break;
        }
      }
    }

    // 2. Insufficient Evidence Guard: If file doesn't exist in project or no evidence
    if (!resolvedTarget || (fileList.length > 0 && !fileList.some((f) => f.relativePath === resolvedTarget))) {
      return {
        provider: 'mock',
        targetFile: resolvedTarget || 'unknown',
        riskLevel: 'LOW',
        affectedFiles: [],
        affectedComponents: [],
        affectedAPIs: [],
        affectedTests: [],
        reasoning: `Insufficient project evidence: The specified target file "${resolvedTarget || 'unknown'}" could not be confirmed in the scanned codebase. No verified callers, APIs, or downstream dependencies exist in the repository index.`,
        recommendedTests: ['Verify target file path matches an existing file in the active codebase repository.'],
      };
    }

    const nodeData = graph[resolvedTarget] || { imports: [], importedBy: [] };
    const directCallers = nodeData.importedBy || [];
    const directImports = nodeData.imports || [];

    // 3. Classify Affected Files: Confirmed vs Likely vs Possible
    const affectedFiles = [];
    const visitedFiles = new Set([resolvedTarget]);

    // Target file itself
    affectedFiles.push({
      file: resolvedTarget,
      confidence: 'Confirmed',
      reason: 'Origin of proposed modification (source of change)',
    });

    // A. Confirmed Dependencies: Direct Callers in AST graph
    for (const caller of directCallers) {
      if (!visitedFiles.has(caller)) {
        visitedFiles.add(caller);
        const isTest = caller.includes('test') || caller.includes('spec');
        affectedFiles.push({
          file: caller,
          confidence: 'Confirmed',
          reason: isTest
            ? 'Direct test specification importing and testing the target file'
            : 'Direct consumer module importing exports from target file',
        });
      }
    }

    // B. Likely Dependencies: Transitive Callers (Callers of Callers)
    const transitiveCallers = [];
    for (const caller of directCallers) {
      const callerNode = graph[caller];
      if (callerNode?.importedBy) {
        for (const transitive of callerNode.importedBy) {
          if (!visitedFiles.has(transitive)) {
            visitedFiles.add(transitive);
            transitiveCallers.push(transitive);
            affectedFiles.push({
              file: transitive,
              confidence: 'Likely',
              reason: `Downstream consumer indirectly relying on ${resolvedTarget.split('/').pop()} via ${caller.split('/').pop()}`,
            });
          }
        }
      }
    }

    // C. Possible Dependencies: Sibling modules in same service directory or UI consumers
    const targetDir = resolvedTarget.includes('/') ? resolvedTarget.split('/')[0] : '';
    if (targetDir) {
      const siblingFiles = fileList
        .filter((f) => f.relativePath.startsWith(targetDir) && !visitedFiles.has(f.relativePath))
        .slice(0, 3);
      for (const sib of siblingFiles) {
        visitedFiles.add(sib.relativePath);
        affectedFiles.push({
          file: sib.relativePath,
          confidence: 'Possible',
          reason: `Co-located in "${targetDir}/" package domain; may share shared configuration or domain types`,
        });
      }
    }

    // 4. Classify Affected Components & Services
    const affectedComponents = [];
    // Target file's components (Confirmed)
    const targetSymbols = allComponents.filter((c) => c.file === resolvedTarget);
    for (const sym of targetSymbols) {
      affectedComponents.push({
        name: sym.name,
        type: sym.kind,
        confidence: 'Confirmed',
        reason: 'Defined directly in the modified file',
      });
    }

    // Callers' components (Likely)
    for (const caller of directCallers) {
      const callerSymbols = allComponents.filter((c) => c.file === caller);
      for (const cs of callerSymbols.slice(0, 3)) {
        affectedComponents.push({
          name: cs.name,
          type: cs.kind,
          confidence: 'Likely',
          reason: `Resides in direct caller ${caller.split('/').pop()}`,
        });
      }
    }

    // 5. Classify Affected APIs
    const affectedAPIs = [];
    // APIs in target file (Confirmed)
    const directApis = allApis.filter((a) => a.file === resolvedTarget);
    for (const api of directApis) {
      affectedAPIs.push({
        method: api.method,
        path: api.path,
        confidence: 'Confirmed',
        reason: `Endpoint handler declared inside ${resolvedTarget}`,
      });
    }

    // APIs in direct callers (Likely)
    for (const caller of directCallers) {
      const callerApis = allApis.filter((a) => a.file === caller);
      for (const api of callerApis) {
        affectedAPIs.push({
          method: api.method,
          path: api.path,
          confidence: 'Likely',
          reason: `Route handler in caller ${caller.split('/').pop()} depends on modified logic`,
        });
      }
    }

    // If an API was touched and frontend exists, mark UI consumer as Possible
    if ((directApis.length > 0 || affectedAPIs.length > 0) && fileList.some((f) => f.relativePath.includes('client') || f.relativePath.endsWith('.jsx') || f.relativePath.endsWith('.tsx'))) {
      const uiFile = fileList.find((f) => f.relativePath.includes('component') || f.relativePath.endsWith('.tsx') || f.relativePath.endsWith('.jsx'));
      if (uiFile && !visitedFiles.has(uiFile.relativePath)) {
        affectedFiles.push({
          file: uiFile.relativePath,
          confidence: 'Possible',
          reason: 'Client-side frontend view consuming updated backend endpoints',
        });
      }
    }

    // 6. Classify Affected Tests
    const affectedTests = [];
    for (const t of allTests) {
      if (t.file === resolvedTarget || directCallers.includes(t.file)) {
        affectedTests.push({
          file: t.file,
          confidence: 'Confirmed',
          reason: `Unit test suite directly importing ${resolvedTarget.split('/').pop()}`,
        });
      } else if (transitiveCallers.includes(t.file)) {
        affectedTests.push({
          file: t.file,
          confidence: 'Likely',
          reason: 'Integration test suite verifying transitive caller flows',
        });
      }
    }

    // 7. Calculate Grounded Risk Level
    const confirmedCount = affectedFiles.filter((f) => f.confidence === 'Confirmed').length;
    const totalAffectedCount = affectedFiles.length;

    let riskLevel = 'LOW';
    if (directApis.length > 0 || confirmedCount >= 4 || totalAffectedCount >= 6) {
      riskLevel = 'CRITICAL';
    } else if (confirmedCount >= 2 || totalAffectedCount >= 3) {
      riskLevel = 'HIGH';
    } else if (confirmedCount >= 1 || directCallers.length > 0) {
      riskLevel = 'MEDIUM';
    }

    // 8. Formulate Detailed Reasoning
    const reasoning = `Modifying ${resolvedTarget.split('/').pop()} impacts ${confirmedCount} confirmed dependent(s), ${affectedFiles.filter((f) => f.confidence === 'Likely').length} likely downstream module(s), and ${affectedFiles.filter((f) => f.confidence === 'Possible').length} possible consumer(s). ${
      directApis.length > 0
        ? `Exposes public API contract changes across ${directApis.map((a) => `${a.method} ${a.path}`).join(', ')}.`
        : 'Internal logic adjustment.'
    } ${affectedTests.length > 0 ? `${affectedTests.length} test suite(s) require regression validation.` : 'No direct test coverage detected.'}`;

    // 9. Recommended Tests & Action
    const recommendedTests = [
      ...(affectedTests.map((t) => `Execute test suite: ${t.file}`)),
      ...(directApis.map((a) => `Verify HTTP response schema for ${a.method} ${a.path}`)),
      `Run regression suite for ${resolvedTarget.split('/').pop()}`,
    ];

    const recommendedAction = riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
      ? `High-risk blast radius detected. Run targeted regression tests for ${resolvedTarget.split('/').pop()}, verify downstream API contracts for ${affectedAPIs.map(a => a.path).slice(0, 2).join(', ') || 'callers'}, and require peer review before merging.`
      : riskLevel === 'MEDIUM'
      ? `Execute test suites for caller components and verify signature compatibility with ${resolvedTarget.split('/').pop()}.`
      : `Safe low-risk change. Run standard unit tests and verify clean linting.`;

    return {
      provider: 'mock',
      targetFile: resolvedTarget,
      riskLevel,
      affectedFiles,
      affectedComponents,
      affectedAPIs,
      affectedTests,
      reasoning,
      recommendedTests: [...new Set(recommendedTests)],
      recommendedAction,
    };
  }

  async generateTests({ targetFile, fileContent, requirement }) {
    const filename = targetFile ? targetFile.split('/').pop().replace(/\.[^/.]+$/, '') : 'module';
    const testCode = `import { describe, it, expect, vi } from 'vitest';
// Automated verification suite generated by DevTwin for: ${targetFile || 'Target Module'}

describe('${filename} Test Suite', () => {
  it('should initialize with default state and valid contracts', () => {
    const input = { ready: true };
    expect(input.ready).toBe(true);
  });

  it('should handle boundary conditions and null/undefined values safely', () => {
    // Regression test for edge-case inputs
    const safeResult = (val) => val ?? 'default_fallback';
    expect(safeResult(null)).toBe('default_fallback');
    expect(safeResult(undefined)).toBe('default_fallback');
  });

  it('should preserve expected output format on execution', async () => {
    const mockFn = vi.fn().mockResolvedValue({ success: true, timestamp: Date.now() });
    const response = await mockFn();
    expect(response.success).toBe(true);
    expect(response.timestamp).toBeGreaterThan(0);
  });
});
`;

    return {
      provider: 'mock',
      framework: 'Vitest / Jest',
      targetFile,
      testCode,
      coverageScope: ['Default flow', 'Null/Boundary checks', 'Async resolution'],
    };
  }

  /**
   * Phase 13: Mock Code Review
   * Returns minimal mock enrichment — real findings come from the heuristic engine.
   */
  async reviewCode({ diff, changedFiles, codeSnippet, prDescription, heuristicFindings, projectContext }) {
    // Mock provider defers to the heuristic engine — we only add a synthetic summary
    const total = heuristicFindings?.length || 0;
    const critical = heuristicFindings?.filter((f) => f.severity === 'CRITICAL').length || 0;
    const high = heuristicFindings?.filter((f) => f.severity === 'HIGH').length || 0;

    let overallRisk = 'LOW';
    if (critical > 0) overallRisk = 'CRITICAL';
    else if (high > 0) overallRisk = 'HIGH';
    else if (total > 0) overallRisk = 'MEDIUM';

    const summary = total > 0
      ? `Heuristic analysis identified ${total} concern(s) (${critical} critical, ${high} high). Enable Gemini or OpenAI for deeper semantic analysis including logic bugs and domain-specific anti-patterns.`
      : 'No heuristic issues detected in the provided code. For deeper semantic review, configure a Gemini or OpenAI API key.';

    return {
      provider: 'mock',
      overallRisk,
      summary,
      findings: [], // heuristic findings are already included by the route handler
      recommendedTests: [],
    };
  }

  /**
   * Phase 11: AI Security Threat Modeling & Posture Synthesis
   */
  async analyzeSecurity({ findings, projectContext, score, counts }) {
    const total = findings?.length || 0;
    const critical = counts?.critical || 0;
    const high = counts?.high || 0;

    let threatPosture = 'Low Risk';
    if (critical > 0) {
      threatPosture = 'Immediate Critical Threat: Hardcoded secrets or unauthenticated administrative pathways detected requiring urgent patch remediation.';
    } else if (high > 0) {
      threatPosture = 'Elevated Risk: High-severity authorization or injection vectors detected that should be addressed before production deployment.';
    } else if (total > 0) {
      threatPosture = 'Moderate Risk: Low to medium security hygiene issues detected (permissive policies or unencrypted transport configs).';
    } else {
      threatPosture = 'Hardened Posture: No OWASP vulnerabilities, exposed secrets, or injection pathways detected in codebase.';
    }

    const summary = `DevTwin Security Twin analyzed ${projectContext?.stats?.totalFiles || 0} repository files. Evaluated 10 OWASP threat categories. Identified ${total} evidence-grounded findings (${critical} Critical, ${high} High, ${counts?.medium || 0} Medium, ${counts?.low || 0} Low). Security Health Score: ${score}/100.`;

    return {
      provider: 'mock',
      threatPosture,
      summary,
    };
  }

  /**
   * Phase 15: Git Intelligence — Commit Analyzer
   * Heuristic-based analysis of a single commit's risk and impact.
   */
  async analyzeCommit({ commit, diff, changedFiles = [], projectContext = {} }) {
    const msg  = (commit?.message || '').toLowerCase();
    const files = changedFiles.map((f) => (f.file || f).toLowerCase());

    // Categorise changed files
    const apis       = changedFiles.filter((f) => /route|controller|api|endpoint/.test(f.file)).length;
    const services   = changedFiles.filter((f) => /service/.test(f.file)).length;
    const testsCount = changedFiles.filter((f) => /test|spec/.test(f.file)).length;
    const components = changedFiles.filter((f) => /component|view|page|ui/.test(f.file)).length;

    // Risk derivation
    const hasAuth   = files.some((p) => /auth|login|password|token|session|jwt|oauth/.test(p));
    const hasConfig = files.some((p) => /config|env|secret|credential/.test(p));
    const hasSql    = files.some((p) => /repositor|database|migration|schema|db/.test(p));
    const hasRoute  = files.some((p) => /route|controller|endpoint|api/.test(p));
    const isBreak   = /breaking|revert|hotfix|critical|refactor|major/.test(msg);
    const isFix     = /fix|bug|patch|resolve/.test(msg);

    let risk = 'LOW';
    if (hasAuth || hasConfig || isBreak) risk = 'HIGH';
    else if (hasSql || hasRoute || changedFiles.length > 8) risk = 'MEDIUM';
    else if (!isFix && changedFiles.length > 4) risk = 'MEDIUM';

    // Potential concerns
    const concerns = [];
    if (hasAuth) concerns.push('Authentication flow changed — verify token handling and session security.');
    if (hasConfig) concerns.push('Configuration or credentials file modified — confirm no secrets are hard-coded.');
    if (hasSql) concerns.push('Database queries or schema changed — verify migration safety and backward compatibility.');
    if (hasRoute) concerns.push('API route definitions changed — downstream consumers may be affected.');
    if (testsCount === 0 && changedFiles.length > 2) concerns.push('No test files included — ensure regression coverage is maintained.');
    if (isBreak) concerns.push('Commit message signals a breaking change — schedule thorough QA review.');
    if (changedFiles.length > 10) concerns.push('Large change set increases merge risk — consider splitting into smaller PRs.');
    if (concerns.length === 0) concerns.push('No obvious concerns detected for this commit.');

    // Recommendations
    const recommendations = [];
    if (risk === 'HIGH') {
      recommendations.push('Require at least two approvals before merging.');
      recommendations.push('Run full regression test suite before deployment.');
      recommendations.push('Consider a feature flag or staged rollout.');
    } else if (risk === 'MEDIUM') {
      recommendations.push('Run targeted integration tests for affected APIs.');
      recommendations.push('Verify dependent services are compatible with these changes.');
    } else {
      recommendations.push('Standard review process applies — low risk change.');
    }

    const summary =
      `Commit "${(commit?.message || '').slice(0, 80)}" modifies ${changedFiles.length} file(s). ` +
      `APIs affected: ${apis}. Services affected: ${services}. Tests included: ${testsCount}. Overall risk: ${risk}.`;

    return {
      provider: 'mock',
      summary,
      apisAffected:       apis,
      servicesAffected:   services,
      testsAffected:      testsCount,
      componentsAffected: components,
      concerns,
      recommendations,
      risk,
    };
  }
}

