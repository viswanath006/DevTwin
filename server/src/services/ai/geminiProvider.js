/**
 * Google Gemini AI Provider
 * Supports gemini-2.5-flash and gemini-1.5-pro using Gemini REST API
 */
export class GeminiAIProvider {
  constructor({ apiKey, model }) {
    this.name = 'Google Gemini';
    this.apiKey = apiKey;
    this.model = model || 'gemini-2.5-flash';
  }

  async callGemini(systemPrompt, userPrompt) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is missing in server/.env');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response received from Gemini.');
    }

    try {
      return JSON.parse(text);
    } catch {
      // In case json parsing needs cleanup
      const cleaned = text.replace(/^```json\s*|\s*```$/g, '');
      return JSON.parse(cleaned);
    }
  }

  async analyzeArchitecture(projectContext) {
    const systemPrompt = `You are DevTwin Architecture Intelligence Engine. Given a normalized codebase context, generate structured architecture understanding.
CRITICAL RULES:
1. Ground every conclusion in the provided evidence (files, packages, APIs, components).
2. If information cannot be determined (e.g., database, frontend, or auth), explicitly mark it as "Unknown" rather than hallucinating.
3. Return valid JSON matching this exact structure:
{
  "architecture": "High-level summary of architecture pattern",
  "architectureType": "Monolith | Polyglot Microservices | Decoupled Client-Server | Backend API | Frontend SPA",
  "frontend": { "detected": true, "framework": "...", "evidence": "..." },
  "backend": { "detected": true, "frameworks": ["..."], "evidence": "..." },
  "database": { "detected": false, "type": "Unknown", "evidence": "..." },
  "components": [{ "name": "...", "type": "Frontend | API | Service | Database", "role": "...", "evidence": "..." }],
  "dataFlow": [{ "step": 1, "from": "...", "to": "...", "protocol": "...", "evidence": "..." }],
  "apiFlow": [{ "method": "...", "endpoint": "...", "consumer": "...", "handler": "...", "evidence": "..." }],
  "dependencies": [{ "name": "...", "importance": "Core | Dev", "role": "...", "evidence": "..." }],
  "risks": [{ "severity": "HIGH | MEDIUM | LOW", "title": "...", "description": "...", "recommendation": "..." }],
  "flowGraph": {
    "nodes": [
      { "id": "frontend", "label": "...", "status": "detected | unknown", "subtext": "...", "evidence": "..." },
      { "id": "api", "label": "...", "status": "detected | unknown", "subtext": "...", "evidence": "..." },
      { "id": "service", "label": "...", "status": "detected | unknown", "subtext": "...", "evidence": "..." },
      { "id": "database", "label": "...", "status": "detected | unknown", "subtext": "...", "evidence": "..." }
    ],
    "edges": [
      { "from": "frontend", "to": "api", "label": "REST Calls" },
      { "from": "api", "to": "service", "label": "Dispatches" },
      { "from": "service", "to": "database", "label": "Queries" }
    ]
  }
}`;

    const sanitizedContext = {
      projectName: projectContext.projectName,
      fileCount: projectContext.fileCount,
      languages: projectContext.languages,
      dependencies: projectContext.dependencies?.slice(0, 25),
      components: projectContext.components?.slice(0, 20),
      apis: projectContext.apis?.slice(0, 15),
      tests: projectContext.tests?.slice(0, 10),
      architecture: projectContext.architecture,
    };

    const userPrompt = `Normalized Project Context:\n${JSON.stringify(sanitizedContext, null, 2)}`;
    const res = await this.callGemini(systemPrompt, userPrompt);
    return { provider: 'gemini', ...res };
  }

  async analyzeCodebase({ stats, query, fileTree }) {
    const systemPrompt = `You are DevTwin, an expert codebase digital twin. Analyze codebase structure and return a structured JSON with:
{
  "summary": "Clear, concise architecture summary answering the user query",
  "keyComponents": [{"name": "...", "path": "...", "role": "..."}],
  "confidence": 0.95
}`;
    const userPrompt = `Codebase stats: ${JSON.stringify(stats)}\nQuery: ${query || 'Give an architectural overview of this project.'}`;
    const res = await this.callGemini(systemPrompt, userPrompt);
    return { provider: 'gemini', ...res };
  }

  async debugRootCause({ error, logs, stackTrace, targetFile, fileContext, relevantFiles = [], dependencyGraph = {} }) {
    const systemPrompt = `You are DevTwin AI Root-Cause Debugger.
Analyze the error message, logs, code files, and dependency graph.
CRITICAL RULES:
1. Do not invent files, functions, APIs, or errors.
2. If evidence is insufficient to diagnose the root cause with certainty, state so clearly in explanation and set confidence <= 0.3.
3. Return valid JSON matching this exact structure:
{
  "rootCause": "Clear concise summary of the defect",
  "confidence": 0.92,
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "affectedFiles": [
    { "file": "path/to/file.ext", "lines": "line range", "role": "Fault Origin | Impacted Caller" }
  ],
  "dependencyChain": [
    { "step": 1, "component": "Caller Component", "type": "Caller", "status": "caller", "description": "Dispatches request" },
    { "step": 2, "component": "Culprit Component:method()", "type": "ROOT CAUSE", "status": "root_cause", "description": "Fault originates here" },
    { "step": 3, "component": "Downstream Impact", "type": "Impacted", "status": "impacted", "description": "Execution fails" }
  ],
  "explanation": "In-depth explanation grounded in the actual code lines and execution flow",
  "suggestedFix": "Concrete description of the proposed fix",
  "patch": "--- path/to/file (original)\\n+++ path/to/file (fixed)\\n@@ -10,3 +10,5 @@\\n- buggy line\\n+ fixed line",
  "recommendedTests": ["test case 1", "test case 2"],
  "evidenceFiles": [
    { "file": "path/to/file", "line": 12, "snippet": "actual code lines" }
  ]
}`;

    const userPrompt = `Error Message:\n${error}\n\nExecution Logs / Stack Trace:\n${logs || stackTrace || 'None provided'}\n\nTarget File:\n${targetFile || 'Auto-detect'}\n\nCode Context:\n${fileContext || JSON.stringify(relevantFiles, null, 2)}`;
    const res = await this.callGemini(systemPrompt, userPrompt);
    return { provider: 'gemini', ...res };
  }

  async analyzeImpact({ targetFile, proposedDiff, changedCode, intent, graphContext, graph = {}, projectContext = {} }) {
    const systemPrompt = `You are DevTwin Change Impact Analyzer. You predict what may be affected across the codebase by a proposed change.
Return ONLY valid JSON matching this schema:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "affectedFiles": [
    { "file": "path/to/file", "confidence": "Confirmed" | "Likely" | "Possible", "reason": "why this file is affected" }
  ],
  "affectedComponents": [
    { "name": "ComponentName", "type": "Class|Function|Component|Service", "confidence": "Confirmed" | "Likely" | "Possible", "reason": "description" }
  ],
  "affectedAPIs": [
    { "method": "GET|POST|PUT|DELETE", "path": "/api/...", "confidence": "Confirmed" | "Likely" | "Possible", "reason": "description" }
  ],
  "affectedTests": [
    { "file": "path/to/test", "confidence": "Confirmed" | "Likely" | "Possible", "reason": "description" }
  ],
  "reasoning": "Detailed, evidence-grounded explanation of the change impact",
  "recommendedTests": ["test suite or validation step 1", "test suite or validation step 2"]
}

STRICT EVIDENCE RULES:
1. Do NOT claim exact impact when project evidence is insufficient. If the target file or change is not in the project, explain the lack of evidence in reasoning.
2. Clearly distinguish evidence levels:
   - "Confirmed": Direct AST caller/importer or test suite directly testing the modified target.
   - "Likely": Transitive downstream consumer (caller of a direct caller).
   - "Possible": Co-located module in the same service/domain directory or UI view consuming affected API routes.
3. Every affected item MUST specify confidence as exactly "Confirmed", "Likely", or "Possible".`;

    const userPrompt = `Target File: ${targetFile || 'Auto-detect from diff or change intent'}
Proposed Diff:
${proposedDiff || 'None provided'}

Changed Code:
${changedCode || 'None provided'}

Intended Change Description:
${intent || 'None provided'}

Project Files & Context:
${JSON.stringify({
  files: (projectContext?.stats?.fileList || []).map((f) => f.relativePath).slice(0, 30),
  apis: projectContext?.apis || [],
  components: (projectContext?.components || []).slice(0, 25),
  tests: projectContext?.tests || [],
  graph: graphContext || graph,
}, null, 2)}`;

    const res = await this.callGemini(systemPrompt, userPrompt);
    return { provider: 'gemini', targetFile: res.targetFile || targetFile, ...res };
  }

  async generateTests({ targetFile, fileContent, requirement }) {
    const systemPrompt = `You are DevTwin Test Generator. Return structured JSON:
{
  "framework": "Vitest / Jest / Pytest",
  "testCode": "Full runnable test file code",
  "coverageScope": ["scope 1", "scope 2"]
}`;
    const userPrompt = `Target File: ${targetFile}\nRequirement: ${requirement || 'Comprehensive unit tests and regression guards'}\nFile Content:\n${fileContent || ''}`;
    const res = await this.callGemini(systemPrompt, userPrompt);
    return { provider: 'gemini', targetFile, ...res };
  }

  /**
   * Phase 13: AI Code Review
   * Reviews diff/code changes and enriches heuristic findings with LLM analysis.
   */
  async reviewCode({ diff, changedFiles, codeSnippet, prDescription, heuristicFindings, projectContext }) {
    const systemPrompt = `You are DevTwin AI Code Reviewer. Analyze the provided code change (diff/snippet) and project context to identify bugs, security issues, performance concerns, architecture violations, error handling gaps, maintainability issues, testing gaps, and breaking-change risks.

CRITICAL RULES:
1. Do NOT invent findings — only flag issues with clear evidence in the provided code.
2. If the provided code is insufficient to make a reliable judgment, say so in summary.
3. Return ONLY valid JSON matching this exact structure:
{
  "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "Concise executive summary of the code review",
  "findings": [
    {
      "id": "ai-unique-id",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "Bugs|Security|Performance|Architecture|Error Handling|Maintainability|Testing Gaps|Breaking Changes",
      "file": "path/to/file or 'Detected in diff'",
      "line": 42,
      "problem": "Clear description of the problem",
      "why": "Why this is a concern with code reasoning",
      "recommendation": "Specific, actionable fix recommendation",
      "evidence": "Exact code snippet or line causing the concern"
    }
  ],
  "recommendedTests": ["test suggestion 1", "test suggestion 2"]
}`;

    const userPrompt = `Git Diff / Code Change:
${diff || codeSnippet || changedFiles?.map(f => `// ${f.path}\n${f.content || ''}`).join('\n\n') || 'None provided'}

PR Description: ${prDescription || 'None provided'}

Heuristic findings already detected (do not duplicate these, only add new findings):
${JSON.stringify((heuristicFindings || []).map(f => ({ id: f.id, category: f.category, severity: f.severity, problem: f.problem })), null, 2)}

Project Context (architecture, files, APIs):
${JSON.stringify({
  architectureType: projectContext?.aiArchitecture?.architectureType,
  apis: (projectContext?.apis || []).slice(0, 10),
  files: (projectContext?.stats?.fileList || []).map(f => f.relativePath).slice(0, 20),
  tests: projectContext?.tests || [],
}, null, 2)}`;

    try {
      const res = await this.callGemini(systemPrompt, userPrompt);
      return { provider: 'gemini', ...res };
    } catch (err) {
      console.warn('[Gemini Code Review Fallback]:', err.message);
      return { provider: 'gemini', findings: [], summary: 'AI review unavailable.', overallRisk: null };
    }
  }

  async analyzeSecurity({ findings, projectContext, score, counts }) {
    const systemPrompt = `You are DevTwin Security Intelligence Engine. You summarize threat posture and synthesize an executive security evaluation based on evidence-grounded findings.
Return ONLY valid JSON matching this schema:
{
  "threatPosture": "Clear 1-2 sentence threat posture statement",
  "summary": "Executive summary of security risks and recommended prioritization"
}`;

    const userPrompt = `Project: ${projectContext?.projectName || 'Repository'}
Files Indexed: ${projectContext?.stats?.totalFiles || 0}
Security Score: ${score}/100
Findings (${findings?.length || 0}):
${JSON.stringify((findings || []).slice(0, 15).map(f => ({ severity: f.severity, category: f.category, title: f.title, file: f.file, line: f.line, evidence: f.evidence })), null, 2)}`;

    try {
      const res = await this.callGemini(systemPrompt, userPrompt);
      return { provider: 'gemini', ...res };
    } catch (err) {
      console.warn('[Gemini Security Analysis Fallback]:', err.message);
      return {
        provider: 'gemini',
        threatPosture: counts?.critical > 0 ? 'Critical Risk: Action required on exposed credentials/secrets' : 'Security audit completed',
        summary: `Gemini scanned ${findings?.length || 0} findings across repository with overall score ${score}/100.`,
      };
    }
  }

  /**
   * Phase 15: Git Intelligence — AI commit analysis
   */
  async analyzeCommit({ commit, diff, changedFiles = [], projectContext = {} }) {
    const systemPrompt = `You are DevTwin Git Intelligence Engine. You analyze a single git commit's diff and changed files to identify risk, potential concerns, and recommendations.
Return ONLY valid JSON matching this schema:
{
  "summary": "1-2 sentence commit summary",
  "apisAffected": 0,
  "servicesAffected": 0,
  "testsAffected": 0,
  "componentsAffected": 0,
  "concerns": ["string"],
  "recommendations": ["string"],
  "risk": "LOW|MEDIUM|HIGH|CRITICAL"
}`;

    const userPrompt = `Project: ${projectContext?.projectName || 'Repository'}
Commit: ${commit?.shortHash} — "${commit?.message}"
Author: ${commit?.author}
Date: ${commit?.date}
Files Changed (${changedFiles.length}):
${changedFiles.slice(0, 20).map(f => `  ${f.file} (+${f.additions} -${f.deletions})`).join('\n')}

Diff (first 4000 chars):
${(diff || '').slice(0, 4000)}`;

    try {
      const res = await this.callGemini(systemPrompt, userPrompt);
      return { provider: 'gemini', ...res };
    } catch (err) {
      console.warn('[Gemini Commit Analysis Fallback]:', err.message);
      const apis = changedFiles.filter(f => /route|controller|api|endpoint/.test(f.file)).length;
      const services = changedFiles.filter(f => /service/.test(f.file)).length;
      const tests = changedFiles.filter(f => /test|spec/.test(f.file)).length;
      return {
        provider: 'gemini',
        summary: `Commit "${commit?.message?.slice(0, 60)}" modifies ${changedFiles.length} files.`,
        apisAffected: apis,
        servicesAffected: services,
        testsAffected: tests,
        componentsAffected: 0,
        concerns: ['Could not perform deep AI analysis — heuristic fallback applied.'],
        recommendations: ['Run tests before merging.'],
        risk: changedFiles.length > 8 ? 'MEDIUM' : 'LOW',
      };
    }
  }

  /**
   * Phase 17: Predictive Change Simulation ("What-If Analysis")
   */
  async simulateWhatIf({ proposedChange, projectContext, graph }) {
    const systemPrompt = `You are DevTwin Predictive Change Simulation Engine. Given a developer's proposed architectural or code change, predict the impact without touching the code.
Return ONLY valid JSON matching this schema:
{
  "risk": "HIGH|MEDIUM|LOW|CRITICAL",
  "predictedImpact": {
    "files": 0,
    "apis": 0,
    "services": 0,
    "tests": 0
  },
  "affectedFiles": [
    { "file": "string", "confidence": "Confirmed|Likely|Potential", "reason": "string" }
  ],
  "affectedComponents": [
    { "name": "string", "type": "string", "confidence": "Confirmed|Likely|Potential", "impact": "string" }
  ],
  "affectedAPIs": [
    { "method": "string", "path": "string", "confidence": "Confirmed|Likely|Potential", "impact": "string" }
  ],
  "affectedTests": [
    { "file": "string", "confidence": "Confirmed|Likely|Potential", "impact": "string" }
  ],
  "potentialProblems": ["string"],
  "recommendedActions": ["string"]
}`;

    const userPrompt = `Proposed Change: "${proposedChange}"
Project Name: ${projectContext?.projectName || 'Project'}
Total Files: ${projectContext?.stats?.totalFiles || 0}
Files List:
${(projectContext?.stats?.fileList || []).map(f => f.relativePath).slice(0, 30).join('\n')}

APIs (${(projectContext?.apis || []).length}):
${(projectContext?.apis || []).slice(0, 15).map(a => `${a.method} ${a.path} (${a.file})`).join('\n')}

Components (${(projectContext?.components || []).length}):
${(projectContext?.components || []).slice(0, 15).map(c => `${c.kind} ${c.name} in ${c.file}`).join('\n')}

Tests (${(projectContext?.tests || []).length}):
${(projectContext?.tests || []).slice(0, 10).map(t => `${t.file} (${t.framework})`).join('\n')}`;

    const res = await this.callGemini(systemPrompt, userPrompt);
    return { provider: 'gemini', ...res };
  }
}


