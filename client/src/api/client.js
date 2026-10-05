/**
 * DevTwin Client API Service
 * Communicates with the local Node.js backend
 */

const BASE_URL = ''; // Proxied via Vite to http://localhost:5000 in dev

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/api/health'),

  // Codebase
  scanCodebase: (repoPath) =>
    request('/api/codebase/scan', {
      method: 'POST',
      body: JSON.stringify({ path: repoPath }),
    }),

  loadDemoProject: () =>
    request('/api/codebase/demo', {
      method: 'POST',
    }),

  uploadCodebase: ({ projectName, files }) =>
    request('/api/codebase/upload', {
      method: 'POST',
      body: JSON.stringify({ projectName, files }),
    }),

  getAIArchitecture: (context) =>
    request('/api/codebase/ai-architecture', {
      method: 'POST',
      body: JSON.stringify({ context }),
    }),

  getFileContent: (filePath, rootPath) => {
    const params = new URLSearchParams({ filePath });
    if (rootPath) params.append('rootPath', rootPath);
    return request(`/api/codebase/file?${params.toString()}`);
  },

  queryCodebase: (query) =>
    request('/api/codebase/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // AI Debugger
  debugRootCause: ({ error, logs, stackTrace, targetFile, rootPath }) =>
    request('/api/debug/root-cause', {
      method: 'POST',
      body: JSON.stringify({ error, logs, stackTrace, targetFile, rootPath }),
    }),

  // Change Impact Analysis
  analyzeImpact: (payload) =>
    request('/api/impact/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Test & Verification
  getTestFrameworks: (projectPath) => {
    const params = new URLSearchParams();
    if (projectPath) params.append('projectPath', projectPath);
    return request(`/api/verify/frameworks?${params.toString()}`);
  },

  generateTests: ({ targetFile, rootPath, requirement }) =>
    request('/api/verify/generate-tests', {
      method: 'POST',
      body: JSON.stringify({ targetFile, rootPath, requirement }),
    }),

  runVerification: ({ projectPath, command, testFile, suite }) =>
    request('/api/verify/run', {
      method: 'POST',
      body: JSON.stringify({ projectPath, command, testFile, suite }),
    }),

  // Phase 11: AI Security Scanner
  runSecurityScan: (rootPath) =>
    request('/api/security/scan', {
      method: 'POST',
      body: JSON.stringify({ rootPath }),
    }),

  getLatestSecurityScan: () => request('/api/security/latest'),

  // Phase 12: Codebase Health Score
  getCodebaseHealthScore: () => request('/api/codebase/health-score'),

  recalculateHealthScore: (payload = {}) =>
    request('/api/codebase/health-score', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Phase 13: AI Code Review
  reviewCode: ({ diff, changedFiles, codeSnippet, prDescription, rootPath } = {}) =>
    request('/api/review/analyze', {
      method: 'POST',
      body: JSON.stringify({ diff, changedFiles, codeSnippet, prDescription, rootPath }),
    }),

  getLatestReview: () => request('/api/review/latest'),

  // Phase 14: Ask Your Codebase
  askCodebase: ({ question, rootPath } = {}) =>
    request('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question, rootPath }),
    }),

  getAskSuggestions: () => request('/api/ask/suggestions'),

  // Phase 15: Git Intelligence
  getGitInfo: (rootPath) => {
    const params = new URLSearchParams();
    if (rootPath) params.append('rootPath', rootPath);
    return request(`/api/git/info?${params.toString()}`);
  },

  analyzeGitCommit: ({ hash, rootPath }) =>
    request('/api/git/analyze', {
      method: 'POST',
      body: JSON.stringify({ hash, rootPath }),
    }),

  // Phase 16: Architecture Drift Detection
  getArchitectureDrift: ({ rootPath, rules } = {}) =>
    request('/api/architecture/drift', {
      method: 'POST',
      body: JSON.stringify({ rootPath, rules }),
    }),

  getArchitectureRules: () => request('/api/architecture/rules'),

  updateArchitectureRules: (payload) =>
    request('/api/architecture/rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Phase 17: Predictive Change Simulation (What-If Analysis)
  simulateWhatIf: ({ proposedChange, rootPath } = {}) =>
    request('/api/impact/what-if', {
      method: 'POST',
      body: JSON.stringify({ proposedChange, rootPath }),
    }),
};

