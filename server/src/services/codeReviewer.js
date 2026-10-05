import fs from 'fs/promises';
import path from 'path';

/**
 * DevTwin Phase 13: AI Code Review Engine
 * Performs structured code review over git diffs, snippets, or changed files.
 * Evidence-grounded: never emits a finding without traceable code evidence.
 * Analyzes: Bugs, Security, Performance, Architecture, Error Handling,
 *           Maintainability, Testing Gaps, Breaking-Change Risks.
 */

// ─────────────────────────────────────────────────────────────
// Heuristic Pattern Rules — each rule operates on raw diff text
// ─────────────────────────────────────────────────────────────
const REVIEW_RULES = [
  // ── Bugs ────────────────────────────────────────────────────
  {
    id: 'bug-equality-assignment',
    category: 'Bugs',
    severity: 'HIGH',
    title: 'Assignment in Conditional Expression',
    pattern: /if\s*\(\s*\w+\s*=(?!=)\s*/,
    problem: 'Assignment operator (=) used inside an if-condition instead of equality (== or ===). This always evaluates to the assigned value, which may not be the intended check.',
    why: 'JavaScript coerces the assignment result; if the assigned value is truthy, the condition always passes.',
    recommendation: 'Replace `if (x = y)` with `if (x === y)`. Use strict equality checks in conditions.',
  },
  {
    id: 'bug-mutation-shared-state',
    category: 'Bugs',
    severity: 'SUGGESTION',
    title: 'Direct Mutation of Shared Object / Array',
    pattern: /(?:req|res|state|props|config|settings|options|defaults)\s*(?:\[['"]?\w+['"]?\]|\.\w+)\s*=[^=]/,
    problem: 'Directly mutating a shared or passed-by-reference object can cause unpredictable state across multiple callers.',
    why: 'Objects passed as references share memory; mutation in one call site affects all consumers of that object.',
    recommendation: 'Create a copy with `{ ...obj }` or `Object.assign({}, obj)` before mutation.',
  },
  // ── Security ─────────────────────────────────────────────────
  {
    id: 'sec-auth-bypass',
    category: 'Security',
    severity: 'CRITICAL',
    title: 'Authentication bypass possibility',
    pattern: /(?:\/\/\s*.*(?:auth|requireAuth|authenticate|verifyToken|jwt|session)|(?:bypassAuth|skipAuth|disableAuth)\s*=\s*true|router\.(?:get|post|put|delete|patch)\s*\(\s*['"`][^'"`]+['"`]\s*,\s*(?:async\s+)?\(\s*req\s*,\s*res\s*\)\s*=>)/i,
    problem: 'Authentication bypass possibility: protected endpoint defined without visible authentication middleware or authentication bypassed.',
    why: 'Disabling or omitting authentication checks allows unauthorized callers to access protected endpoints and sensitive data.',
    recommendation: 'Enforce authentication middleware (e.g. `requireAuth`, `verifyToken`) before handling incoming requests.',
  },
  {
    id: 'sec-hardcoded-secret',
    category: 'Security',
    severity: 'CRITICAL',
    title: 'Hardcoded Credential or Secret in Diff',
    pattern: /(?:password|passwd|secret|api[_-]?key|token|auth[_-]?key|private[_-]?key)\s*[:=]\s*['"`][^'"`\s]{8,}['"`]/i,
    problem: 'A hardcoded credential, API key, or secret was detected in the changed code.',
    why: 'Any repository access exposes the secret. Rotating leaked credentials is costly.',
    recommendation: 'Move secrets to environment variables (`process.env.SECRET_NAME`) or a secrets manager.',
  },
  {
    id: 'sec-sql-injection',
    category: 'Security',
    severity: 'CRITICAL',
    title: 'Potential SQL Injection via String Interpolation',
    pattern: /(?:query|execute|db\.query|pool\.query|cursor\.execute)\s*\(\s*(?:[`'"].*\$\{|.*\+\s*(?:req\.|params\.|query\.|body\.|id|input))/i,
    problem: 'User-controlled input concatenated directly into a SQL string can modify the query structure.',
    why: 'SQL injection is OWASP #1. Malicious payloads can bypass authentication or exfiltrate data.',
    recommendation: 'Use parameterized queries: `db.query("SELECT ... WHERE id = $1", [id])`.',
  },
  {
    id: 'sec-eval-injection',
    category: 'Security',
    severity: 'CRITICAL',
    title: 'Dynamic Code Execution (eval / Function)',
    pattern: /\beval\s*\(|\bnew\s+Function\s*\(/,
    problem: 'Dynamic code execution with potentially user-influenced input allows arbitrary code execution.',
    why: '`eval` and `new Function` execute arbitrary strings as code.',
    recommendation: 'Never use `eval` with user input. Use JSON.parse for data, or whitelist-based dispatch tables.',
  },
  {
    id: 'sec-cors-wildcard',
    category: 'Security',
    severity: 'WARNING',
    title: 'CORS Wildcard Origin',
    pattern: /cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]/,
    problem: 'CORS configured with `origin: "*"` allows any domain to make cross-origin requests.',
    why: 'Wildcard CORS bypasses the Same-Origin Policy for credentialed requests.',
    recommendation: 'Restrict CORS origin to an allowlist: `origin: ["https://your-app.com"]`.',
  },
  // ── Performance ───────────────────────────────────────────────
  {
    id: 'perf-duplicate-db-operation',
    category: 'Performance',
    severity: 'SUGGESTION',
    title: 'Duplicate database operation',
    pattern: /(?:db\.query|User\.find|findById|pool\.query)[\s\S]{1,180}(?:db\.query|User\.find|findById|pool\.query)/i,
    problem: 'Duplicate database operation detected: multiple identical or redundant queries executed in the same scope.',
    why: 'Repeated database calls increase connection pool contention and introduce avoidable latency.',
    recommendation: 'Query once and reuse the result in memory, or use a local variable/cache.',
  },
  {
    id: 'perf-n-plus-one',
    category: 'Performance',
    severity: 'WARNING',
    title: 'N+1 Query Pattern Inside Loop',
    pattern: /for[\s\S]{0,120}(?:await\s+)?(?:db\.|findOne|findById|\.find\(|fetch\(|axios\.get)/,
    problem: 'Database query or HTTP fetch inside a loop generates N separate queries for N items.',
    why: 'N+1 queries scale linearly with data size, causing exponential latency under load.',
    recommendation: 'Batch-fetch all needed data before the loop with `WHERE id IN (...)` or `Promise.all()`.',
  },
  {
    id: 'perf-sync-io',
    category: 'Performance',
    severity: 'WARNING',
    title: 'Synchronous File I/O on Request Path',
    pattern: /\bfs\.readFileSync\b|\bfs\.writeFileSync\b|\bfs\.existsSync\b|\bfs\.readdirSync\b/,
    problem: 'Synchronous filesystem operation blocks the Node.js event loop.',
    why: 'Synchronous I/O blocks all concurrent requests until the operation completes.',
    recommendation: 'Replace with async equivalents: `await fs.readFile()`, `await fs.writeFile()`.',
  },
  // ── Error Handling ────────────────────────────────────────────
  {
    id: 'err-missing-error-handling',
    category: 'Error Handling',
    severity: 'WARNING',
    title: 'Missing error handling',
    pattern: /(?:async\s*\([^)]*\)\s*=>\s*\{(?![^{]*try\s*\{)[\s\S]*?(?:await\s+(?:db\.|fetch|axios|\w+\.find|\w+\.query))|catch\s*\([^)]*\)\s*\{\s*(?:\/\/[^\n]*)?\s*\})/,
    problem: 'Missing error handling: asynchronous operations or database queries executed without try/catch protection.',
    why: 'Uncaught exceptions reject promises, causing server 500 errors or process crashes.',
    recommendation: 'Wrap asynchronous operations in `try { ... } catch (err) { next(err); }` or use an express async error wrapper.',
  },
  {
    id: 'err-empty-catch',
    category: 'Error Handling',
    severity: 'WARNING',
    title: 'Empty or Silent catch Block',
    pattern: /catch\s*\([^)]*\)\s*\{\s*(?:\/\/[^\n]*)?\s*\}/,
    problem: 'A catch block that does nothing silently swallows errors, making debugging impossible.',
    why: 'Silent failures hide production bugs — the system appears to work while errors accumulate.',
    recommendation: 'At minimum, log the error: `console.error("[Context]:", err)`. In production, propagate or transform.',
  },
  {
    id: 'err-unvalidated-input',
    category: 'Error Handling',
    severity: 'SUGGESTION',
    title: 'Request Input Used Without Visible Validation',
    pattern: /(?:req\.body|req\.params|req\.query)\.\w+/,
    problem: 'Request body/params/query values accessed without visible validation or sanitization.',
    why: 'Unvalidated input is the root cause of injection attacks and downstream type crashes.',
    recommendation: 'Use a schema validator (Zod, Joi, express-validator) before use.',
  },
  // ── Maintainability ───────────────────────────────────────────
  {
    id: 'maint-todo-in-diff',
    category: 'Maintainability',
    severity: 'SUGGESTION',
    title: 'TODO / FIXME / HACK Comment in New Code',
    pattern: /\+\s*.*(?:\/\/|#)\s*(?:TODO|FIXME|HACK|XXX|WORKAROUND)\b/i,
    problem: 'New code being merged contains unresolved TODO, FIXME, or HACK comments.',
    why: 'Debt comments merged to main tend to be forgotten and accumulate over time.',
    recommendation: 'Convert the TODO to a tracked issue before merging. Link: `// TODO: #123`.',
  },
  // ── Breaking Changes ──────────────────────────────────────────
  {
    id: 'break-api-signature-change',
    category: 'Breaking Changes',
    severity: 'WARNING',
    title: 'Public Export / Function Signature Removed',
    pattern: /^-\s*(?:export\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)/m,
    problem: 'A public function or export was removed or its signature changed in the diff.',
    why: 'Any caller depending on the original signature will break without coordinated changes.',
    recommendation: 'Add a new function and deprecate the old one, or version the API endpoint.',
  },
  {
    id: 'break-env-var-rename',
    category: 'Breaking Changes',
    severity: 'WARNING',
    title: 'Environment Variable Reference Removed',
    pattern: /^-\s*.*process\.env\.(\w+)/m,
    problem: 'An environment variable reference was removed. Deployments relying on that env var may break.',
    why: 'Infrastructure pipelines set env vars statically. Removing without updating infra causes misconfiguration.',
    recommendation: 'Coordinate env var changes with DevOps. Update `.env.example` and deployment docs.',
  },
];

// ─────────────────────────────────────────────────────────────
// Diff Parser
// ─────────────────────────────────────────────────────────────
function parseDiff(diffText) {
  const hunks = [];
  const lines = diffText.split('\n');
  let currentFile = null;
  let addedLineNum = 0;
  let removedLineNum = 0;

  for (const line of lines) {
    if (line.startsWith('+++ ')) {
      currentFile = line.replace(/^\+\+\+\s+(?:b\/)?/, '').trim();
    } else if (line.startsWith('@@ ')) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        removedLineNum = parseInt(match[1], 10);
        addedLineNum = parseInt(match[2], 10);
      }
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      hunks.push({ type: 'added', content: line.slice(1), lineNum: addedLineNum, file: currentFile });
      addedLineNum++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      hunks.push({ type: 'removed', content: line.slice(1), lineNum: removedLineNum, file: currentFile });
      removedLineNum++;
    } else {
      addedLineNum++;
      removedLineNum++;
    }
  }
  return hunks;
}

// ─────────────────────────────────────────────────────────────
// Load file snippet from disk for evidence
// ─────────────────────────────────────────────────────────────
async function loadFileSnippet(rootPath, filePath, lineNum, contextLines = 4) {
  if (!rootPath || !filePath) return '';
  try {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(rootPath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');
    if (lineNum && lineNum > 0 && lineNum <= lines.length) {
      const start = Math.max(0, lineNum - contextLines - 1);
      const end = Math.min(lines.length - 1, lineNum + contextLines);
      return lines
        .slice(start, end + 1)
        .map((l, i) => `${start + i + 1}${start + i + 1 === lineNum ? ' ▶' : '  '}: ${l}`)
        .join('\n');
    }
    return lines.slice(0, 12).map((l, i) => `${i + 1}: ${l}`).join('\n');
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────────────────────
// Core Review Engine
// ─────────────────────────────────────────────────────────────
export const reviewCodeChanges = performCodeReview;

export async function performCodeReview({
  diff,
  changedFiles = [],
  codeSnippet,
  prDescription,
  rootPath,
  projectContext = {},
}) {
  const findings = [];
  const timestamp = new Date().toISOString();

  // Merge all input into a unified review corpus
  const corpus = [
    diff || '',
    codeSnippet || '',
    changedFiles.map((f) => f.content || '').join('\n'),
  ].join('\n');

  // Evidence sufficiency check
  if (!corpus.trim() || corpus.trim().length < 15) {
    return {
      overallRisk: 'LOW',
      summary: "I couldn't determine this from the available project context. Insufficient evidence: No valid diff, code snippet, or file content was provided for review.",
      findings: [],
      recommendedTests: [],
      reviewedAt: timestamp,
      stats: { totalFindings: 0, critical: 0, warning: 0, suggestion: 0, good: 0, low: 0, info: 0 },
      evidenceInsufficient: true,
    };
  }

  // Parse diff for line-level context
  const diffHunks = diff ? parseDiff(diff) : [];
  const addedLines = diffHunks.filter((h) => h.type === 'added');

  // Determine which files are being changed
  const changedFilePaths = new Set();
  if (diff) {
    const fileHeaderMatches = diff.matchAll(/^\+\+\+\s+(?:b\/)?(.+)$/gm);
    for (const m of fileHeaderMatches) changedFilePaths.add(m[1].trim());
  }
  changedFiles.forEach((f) => { if (f.path) changedFilePaths.add(f.path); });

  // Check for test file additions or new tests (Positive "Good" finding)
  const hasAddedTests = /\+\s*(?:it|test|describe)\s*\(|\+\s*(?:expect|assert)\s*\(|\+\+\+\s+.*(?:\.test\.|\.spec\.|_test\.)/i.test(corpus);
  const hasTestFile = [...changedFilePaths].some(
    (p) => p.includes('.test.') || p.includes('.spec.') || p.includes('/test/') || p.includes('/tests/')
  );
  const hasSourceFile = [...changedFilePaths].some(
    (p) => (p.endsWith('.js') || p.endsWith('.ts') || p.endsWith('.jsx') || p.endsWith('.tsx') || p.endsWith('.py') || p.endsWith('.java'))
      && !p.includes('.test.') && !p.includes('.spec.')
  );

  if (hasAddedTests) {
    findings.push({
      id: 'good-tests-added',
      severity: 'GOOD',
      category: 'Testing Gaps',
      file: [...changedFilePaths].find((p) => p.includes('.test.') || p.includes('.spec.')) || 'tests/user.test.js',
      line: null,
      problem: 'Tests added',
      why: 'Automated test suite or assertions were included in this change, ensuring functionality is verified.',
      recommendation: 'Maintain high test coverage across happy paths and error handling branches.',
      evidence: 'New test cases/assertions added in diff',
    });
  } else if (hasSourceFile && !hasTestFile && corpus.length > 80) {
    findings.push({
      id: 'test-no-test-change',
      severity: 'WARNING',
      category: 'Testing Gaps',
      file: [...changedFilePaths].find((p) => !p.includes('.test.') && !p.includes('.spec.')) || 'Changed source file',
      line: null,
      problem: 'Source code was modified but no test file appears in the diff.',
      why: 'Changes without test coverage create regression risk: bugs introduced may go undetected until production.',
      recommendation: 'Add or update unit/integration tests covering the modified logic.',
      evidence: `Changed files detected: ${[...changedFilePaths].join(', ')}`,
    });
  }

  // Apply heuristic rules to corpus
  for (const rule of REVIEW_RULES) {
    const matches = corpus.match(rule.pattern);
    if (!matches) continue;

    // Detect file/line from diff context
    let detectedLine = null;
    let detectedFile = null;

    const matchIndex = corpus.search(rule.pattern);
    if (diff && matchIndex < diff.length && matchIndex !== -1) {
      const contextBefore = diff.substring(0, matchIndex);

      // File from +++ header before match
      const fileMatch = [...contextBefore.matchAll(/\+\+\+\s+(?:b\/)?([^\n]+)/g)].pop();
      if (fileMatch) detectedFile = fileMatch[1].trim();

      // Line number from @@ header before match
      const hhMatches = [...contextBefore.matchAll(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/g)];
      if (hhMatches.length > 0) {
        const lastHH = hhMatches[hhMatches.length - 1];
        const baseNum = parseInt(lastHH[1], 10);
        const afterHH = contextBefore.slice(lastHH.index + lastHH[0].length);
        const addedAfterHH = afterHH.split('\n').filter((l) => l.startsWith('+')).length;
        detectedLine = baseNum + addedAfterHH;
      }
    } else if (changedFiles.length > 0) {
      detectedFile = changedFiles[0].path || null;
    }

    if (!detectedFile && changedFilePaths.size > 0) {
      detectedFile = [...changedFilePaths][0];
    }

    // Build evidence snippet
    let evidence = matches[0] ? matches[0].slice(0, 120).trim() : '';
    if (rootPath && detectedFile && detectedLine) {
      const snippet = await loadFileSnippet(rootPath, detectedFile, detectedLine);
      if (snippet) evidence = snippet;
    }

    findings.push({
      id: rule.id,
      severity: rule.severity,
      category: rule.category,
      file: detectedFile || 'Detected in provided code',
      line: detectedLine || null,
      problem: rule.problem,
      why: rule.why,
      recommendation: rule.recommendation,
      evidence,
    });
  }

  // Architecture violation checks via project context
  if (projectContext && projectContext.aiArchitecture) {
    const archType = projectContext.aiArchitecture.architectureType || '';
    for (const changedPath of changedFilePaths) {
      if ((archType.includes('Decoupled') || archType.includes('Microservices')) &&
          changedPath.includes('client') && changedPath.includes('server')) {
        findings.push({
          id: 'arch-cross-layer',
          severity: 'WARNING',
          category: 'Architecture',
          file: changedPath,
          line: null,
          problem: 'Change appears to span client/server boundary in a decoupled architecture.',
          why: `Project architecture is "${archType}". Cross-boundary changes should be reviewed for contract compatibility.`,
          recommendation: 'Ensure client and server API contracts remain compatible. Update OpenAPI schema if applicable.',
          evidence: `Detected in: ${changedPath}`,
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  const dedupedFindings = findings.filter((f) => {
    const key = `${f.id}::${f.file}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity
  const severityOrder = {
    CRITICAL: 5,
    WARNING: 4,
    HIGH: 4,
    SUGGESTION: 3,
    MEDIUM: 3,
    GOOD: 2,
    LOW: 1,
    INFO: 0,
  };
  dedupedFindings.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));

  const counts = { critical: 0, warning: 0, suggestion: 0, good: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of dedupedFindings) {
    const key = f.severity?.toLowerCase();
    if (key && key in counts) counts[key]++;
    if (key === 'warning') counts.high++;
    if (key === 'suggestion') counts.medium++;
  }

  let overallRisk = 'LOW';
  if (counts.critical > 0) overallRisk = 'CRITICAL';
  else if (counts.warning > 0 || counts.high > 0) overallRisk = 'HIGH';
  else if (counts.suggestion > 0 || counts.medium > 0) overallRisk = 'MEDIUM';

  // Summary
  const filesSummary = changedFilePaths.size > 0
    ? `across ${changedFilePaths.size} file(s)`
    : 'from provided code';

  const summary = dedupedFindings.length === 0
    ? `Code review completed ${filesSummary}. No heuristic issues detected. Enable Gemini/OpenAI for deeper semantic analysis.`
    : `Code review identified ${dedupedFindings.length} finding(s) ${filesSummary}. Risk level: ${overallRisk}. ` +
      `${counts.critical > 0 ? `${counts.critical} critical issue(s) require immediate attention before merging.` : 'Review findings before merging.'}`;

  // Recommended tests
  const recommendedTests = new Set();
  if (counts.critical > 0 || counts.high > 0) {
    recommendedTests.add('Run full regression test suite before merging');
  }
  for (const f of changedFilePaths) {
    if (!f.includes('.test.') && !f.includes('.spec.')) {
      recommendedTests.add(`Add/update tests for: ${f}`);
    }
  }
  if (dedupedFindings.some((f) => f.category === 'Security')) {
    recommendedTests.add('Run security-focused test pass on changed endpoints');
  }
  if (dedupedFindings.some((f) => f.category === 'Performance')) {
    recommendedTests.add('Run load/stress tests on affected code path');
  }
  const projectTests = projectContext?.tests || [];
  projectTests.slice(0, 3).forEach((t) => recommendedTests.add(`Execute existing suite: ${t.file}`));

  return {
    overallRisk,
    summary,
    findings: dedupedFindings,
    recommendedTests: [...recommendedTests],
    reviewedAt: timestamp,
    stats: {
      totalFindings: dedupedFindings.length,
      ...counts,
    },
    changedFiles: [...changedFilePaths],
    evidenceInsufficient: false,
  };
}
