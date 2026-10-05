/**
 * OpenAI / OpenRouter AI Provider
 * Supports gpt-4o, gpt-4o-mini, and compatible chat completions endpoints
 */
export class OpenAIProvider {
  constructor({ apiKey, model }) {
    this.name = 'OpenAI';
    this.apiKey = apiKey;
    this.model = model || 'gpt-4o-mini';
  }

  async callOpenAI(systemPrompt, userPrompt) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is missing in server/.env');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI.');
    }

    return JSON.parse(content);
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
    const res = await this.callOpenAI(systemPrompt, userPrompt);
    return { provider: 'openai', ...res };
  }

  async analyzeCodebase({ stats, query, fileTree }) {
    const systemPrompt = `You are DevTwin, an expert codebase digital twin. Return JSON with:
{
  "summary": "Clear, concise architecture summary answering the user query",
  "keyComponents": [{"name": "...", "path": "...", "role": "..."}],
  "confidence": 0.95
}`;
    const userPrompt = `Codebase stats: ${JSON.stringify(stats)}\nQuery: ${query || 'Give an architectural overview of this project.'}`;
    const res = await this.callOpenAI(systemPrompt, userPrompt);
    return { provider: 'openai', ...res };
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
    const res = await this.callOpenAI(systemPrompt, userPrompt);
    return { provider: 'openai', ...res };
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

    const res = await this.callOpenAI(systemPrompt, userPrompt);
    return { provider: 'openai', targetFile: res.targetFile || targetFile, ...res };
  }

  async generateTests({ targetFile, fileContent, requirement }) {
    const systemPrompt = `You are DevTwin Test Generator. Return JSON:
{
  "framework": "Vitest / Jest / Pytest",
  "testCode": "Full runnable test file code",
  "coverageScope": ["scope 1", "scope 2"]
}`;
    const userPrompt = `Target File: ${targetFile}\nRequirement: ${requirement || 'Comprehensive unit tests and regression guards'}\nFile Content:\n${fileContent || ''}`;
    const res = await this.callOpenAI(systemPrompt, userPrompt);
    return { provider: 'openai', targetFile, ...res };
  }

  /**
   * Phase 13: AI Code Review
   */
  async reviewCode({ diff, changedFiles, codeSnippet, prDescription, heuristicFindings, projectContext }) {
    const systemPrompt = `You are DevTwin AI Code Reviewer. Analyze the code change and project context.
CRITICAL RULES: Only flag issues with clear evidence. Return ONLY valid JSON:
{
  "overallRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "summary": "Concise executive review summary",
  "findings": [
    {
      "id": "ai-unique-id",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "Bugs|Security|Performance|Architecture|Error Handling|Maintainability|Testing Gaps|Breaking Changes",
      "file": "path/to/file",
      "line": 42,
      "problem": "Description of the problem",
      "why": "Why this is a concern",
      "recommendation": "Actionable fix",
      "evidence": "Exact code snippet"
    }
  ],
  "recommendedTests": ["test suggestion 1"]
}`;
    const userPrompt = `Diff:\n${diff || codeSnippet || 'None'}\nPR Description: ${prDescription || 'None'}\nHeuristic findings (do not duplicate):\n${JSON.stringify((heuristicFindings || []).map(f => ({ id: f.id, category: f.category, severity: f.severity })))}\nProject: ${JSON.stringify({ apis: (projectContext?.apis || []).slice(0, 8), tests: projectContext?.tests || [] })}`;
    try {
      const res = await this.callOpenAI(systemPrompt, userPrompt);
      return { provider: 'openai', ...res };
    } catch (err) {
      console.warn('[OpenAI Code Review Fallback]:', err.message);
      return { provider: 'openai', findings: [], summary: 'AI review unavailable.', overallRisk: null };
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
      const res = await this.callOpenAI(systemPrompt, userPrompt);
      return { provider: 'openai', ...res };
    } catch (err) {
      console.warn('[OpenAI Security Analysis Fallback]:', err.message);
      return {
        provider: 'openai',
        threatPosture: counts?.critical > 0 ? 'Critical Risk: Action required on exposed credentials/secrets' : 'Security audit completed',
        summary: `OpenAI scanned ${findings?.length || 0} findings across repository with overall score ${score}/100.`,
      };
    }
  }
}

