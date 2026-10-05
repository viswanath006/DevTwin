/**
 * Phase 15: Git Intelligence Service
 * Reads actual git data from any scanned repository via simple-git.
 * Falls back to a clear "not a git repo" result — never fabricates data.
 */

import { simpleGit } from 'simple-git';
import path from 'path';
import { getAIProvider } from './ai/aiProvider.js';

// ── helpers ────────────────────────────────────────────────────────────────

/** Map extension → language label */
const EXT_LANG = {
  js: 'JavaScript', ts: 'TypeScript', jsx: 'React/JSX', tsx: 'React/TSX',
  py: 'Python', java: 'Java', rb: 'Ruby', go: 'Go', rs: 'Rust',
  cs: 'C#', cpp: 'C++', c: 'C', php: 'PHP', swift: 'Swift',
  kt: 'Kotlin', scala: 'Scala', sh: 'Shell', yml: 'YAML',
  yaml: 'YAML', json: 'JSON', md: 'Markdown', html: 'HTML', css: 'CSS',
};

function extToLang(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_LANG[ext] || ext.toUpperCase() || 'Unknown';
}

/** Parse `git log` output into structured commit objects */
function parseCommits(rawLog) {
  return (rawLog.all || []).map((c) => ({
    hash:      c.hash,
    shortHash: c.hash?.slice(0, 7) ?? '???????',
    message:   c.message?.trim() ?? '',
    author:    c.author_name ?? 'Unknown',
    email:     c.author_email ?? '',
    date:      c.date ?? new Date().toISOString(),
    refs:      c.refs ?? '',
  }));
}

/** Derive risk category for a commit based on its changed files */
function deriveCommitRisk(changedFiles = [], message = '') {
  const msg = message.toLowerCase();
  const paths = changedFiles.map((f) => (f.file || f).toLowerCase());

  const hasAuth    = paths.some((p) => /auth|login|password|token|session|jwt|oauth/.test(p));
  const hasConfig  = paths.some((p) => /config|env|secret|credential/.test(p));
  const hasSql     = paths.some((p) => /repositor|database|migration|schema|db/.test(p));
  const hasRoute   = paths.some((p) => /route|controller|endpoint|api/.test(p));
  const isBreaking = /breaking|revert|hotfix|critical|refactor|major/.test(msg);
  const isFix      = /fix|bug|patch|resolve/.test(msg);
  const isChore    = /chore|docs|style|lint|format|test/.test(msg);

  if (hasAuth || hasConfig || isBreaking) return 'HIGH';
  if (hasSql || hasRoute) return 'MEDIUM';
  if (isFix) return 'LOW';
  if (isChore) return 'LOW';
  return changedFiles.length > 8 ? 'MEDIUM' : 'LOW';
}

/** Derive tags that describe what a commit touches */
function deriveCommitTags(changedFiles = [], message = '') {
  const msg = message.toLowerCase();
  const paths = changedFiles.map((f) => (f.file || f).toLowerCase());
  const tags = [];

  if (paths.some((p) => /auth|login|token|jwt/.test(p))) tags.push('auth');
  if (paths.some((p) => /api|route|controller|endpoint/.test(p))) tags.push('api');
  if (paths.some((p) => /service/.test(p))) tags.push('service');
  if (paths.some((p) => /test|spec/.test(p))) tags.push('tests');
  if (paths.some((p) => /database|repository|migration|schema|db/.test(p))) tags.push('database');
  if (paths.some((p) => /config|env/.test(p))) tags.push('config');
  if (paths.some((p) => /component|view|page|ui/.test(p))) tags.push('ui');
  if (/fix|bug|patch/.test(msg)) tags.push('bugfix');
  if (/feature|feat|add/.test(msg)) tags.push('feature');
  if (/refactor/.test(msg)) tags.push('refactor');

  return tags.length ? tags : ['general'];
}

// ── main export ────────────────────────────────────────────────────────────

/**
 * getGitIntelligence(rootPath, projectContext)
 * Returns { isGitRepo, branch, commits, status, stats, ... }
 */
export async function getGitRepositoryInfo(rootPath) {
  return getGitIntelligence(typeof rootPath === 'string' ? { rootPath } : (rootPath || {}));
}

export async function getGitIntelligence({ rootPath, projectContext = {} } = {}) {
  if (!rootPath) {
    return { isGitRepo: false, reason: 'No repository path provided.' };
  }

  const git = simpleGit(rootPath);

  // ── 1. Detect Git repo ──────────────────────────────────────────────────
  let isGitRepo = false;
  try {
    isGitRepo = await git.checkIsRepo();
  } catch {
    isGitRepo = false;
  }

  if (!isGitRepo) {
    return {
      isGitRepo: false,
      reason: `${path.basename(rootPath)} is not a Git repository. Initialize with "git init" to enable Git Intelligence.`,
      rootPath,
    };
  }

  // ── 2. Branch info ──────────────────────────────────────────────────────
  let branch = 'unknown';
  let allBranches = [];
  try {
    const branchSummary = await git.branchLocal();
    branch = branchSummary.current;
    allBranches = Object.keys(branchSummary.branches);
  } catch { /* ignore */ }

  // ── 3. Recent commits (up to 30) ────────────────────────────────────────
  let rawLog = { all: [] };
  try {
    rawLog = await git.log({ maxCount: 30, '--stat': null });
  } catch { /* ignore */ }
  const commits = parseCommits(rawLog);

  // ── 4. Working-tree status ──────────────────────────────────────────────
  let workingStatus = { modified: [], staged: [], untracked: [] };
  try {
    const st = await git.status();
    workingStatus = {
      modified:  st.modified  || [],
      staged:    st.staged    || [],
      untracked: st.not_added || [],
      conflicted: st.conflicted || [],
    };
  } catch { /* ignore */ }

  // ── 5. Per-commit file changes (last 10) ─────────────────────────────────
  const enrichedCommits = [];
  for (let i = 0; i < Math.min(commits.length, 10); i++) {
    const c = commits[i];
    let changedFiles = [];
    try {
      const showResult = await git.show(['--stat', '--format=', c.hash]);
      // Parse "path/to/file | N ++++----" lines
      changedFiles = showResult
        .split('\n')
        .filter((l) => l.includes('|'))
        .map((l) => {
          const parts = l.split('|');
          const filePart = parts[0].trim();
          const statPart = (parts[1] || '').trim();
          const plus  = (statPart.match(/\+/g) || []).length;
          const minus = (statPart.match(/-/g) || []).length;
          return {
            file:      filePart,
            language:  extToLang(filePart),
            additions: plus,
            deletions: minus,
          };
        })
        .filter((f) => f.file);
    } catch { /* ignore */ }

    enrichedCommits.push({
      ...c,
      changedFiles,
      filesChanged:  changedFiles.length,
      risk:          deriveCommitRisk(changedFiles, c.message),
      tags:          deriveCommitTags(changedFiles, c.message),
    });
  }

  // Remaining commits (11-30) without file detail
  for (let i = 10; i < commits.length; i++) {
    const c = commits[i];
    enrichedCommits.push({
      ...c,
      changedFiles: [],
      filesChanged: 0,
      risk:         deriveCommitRisk([], c.message),
      tags:         deriveCommitTags([], c.message),
    });
  }

  // ── 6. Aggregate stats ──────────────────────────────────────────────────
  const riskCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  enrichedCommits.forEach((c) => { riskCounts[c.risk] = (riskCounts[c.risk] || 0) + 1; });

  // Author activity
  const authorMap = {};
  enrichedCommits.forEach((c) => {
    const a = c.author;
    authorMap[a] = (authorMap[a] || 0) + 1;
  });
  const topAuthors = Object.entries(authorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, commits]) => ({ name, commits }));

  // Hot files (most changed)
  const fileFreq = {};
  enrichedCommits.forEach((c) =>
    c.changedFiles.forEach((f) => {
      fileFreq[f.file] = (fileFreq[f.file] || 0) + 1;
    })
  );
  const hotFiles = Object.entries(fileFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([file, changes]) => ({ file, changes, language: extToLang(file) }));

  return {
    isGitRepo: true,
    rootPath,
    branch,
    allBranches,
    totalCommits: enrichedCommits.length,
    commits: enrichedCommits,
    workingStatus,
    stats: {
      riskCounts,
      topAuthors,
      hotFiles,
      highRiskCommits: enrichedCommits.filter((c) => c.risk === 'HIGH').length,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * analyzeCommit(hash, rootPath, projectContext)
 * AI-powered deep analysis for a single commit.
 */
export async function analyzeCommit({ hash, rootPath, projectContext = {} }) {
  if (!rootPath || !hash) throw new Error('Missing hash or rootPath');

  const git = simpleGit(rootPath);

  // Get commit detail
  let commitInfo = null;
  try {
    const log = await git.log({ maxCount: 1, from: `${hash}^`, to: hash });
    commitInfo = log.latest;
  } catch {
    // single commit
    const log = await git.log({ maxCount: 1 });
    commitInfo = log.latest;
  }

  // Get full diff
  let diff = '';
  try {
    diff = await git.show([hash, '--unified=3']);
  } catch { /* ignore */ }

  // Get stat
  let changedFiles = [];
  try {
    const stat = await git.show(['--stat', '--format=', hash]);
    changedFiles = stat
      .split('\n')
      .filter((l) => l.includes('|'))
      .map((l) => {
        const parts = l.split('|');
        return {
          file:      parts[0].trim(),
          language:  extToLang(parts[0].trim()),
          additions: (parts[1]?.match(/\+/g) || []).length,
          deletions: (parts[1]?.match(/-/g) || []).length,
        };
      })
      .filter((f) => f.file);
  } catch { /* ignore */ }

  const risk = deriveCommitRisk(changedFiles, commitInfo?.message ?? '');
  const tags = deriveCommitTags(changedFiles, commitInfo?.message ?? '');

  // ── AI Analysis ──────────────────────────────────────────────────────────
  const ai = getAIProvider();
  let aiAnalysis = null;
  try {
    aiAnalysis = await ai.analyzeCommit({
      commit: {
        hash,
        shortHash: hash.slice(0, 7),
        message: commitInfo?.message ?? '',
        author:  commitInfo?.author_name ?? '',
        date:    commitInfo?.date ?? '',
      },
      diff: diff.slice(0, 8000), // cap to avoid token overflow
      changedFiles,
      projectContext,
    });
  } catch (err) {
    console.error('[GitIntelligence] AI analyzeCommit failed:', err.message);
    aiAnalysis = buildFallbackAnalysis(changedFiles, commitInfo?.message ?? '', risk, tags);
  }

  return {
    hash,
    shortHash: hash.slice(0, 7),
    message:   commitInfo?.message ?? '',
    author:    commitInfo?.author_name ?? '',
    date:      commitInfo?.date ?? '',
    changedFiles,
    diff,
    risk,
    tags,
    aiAnalysis,
    timestamp: new Date().toISOString(),
  };
}

/** Fallback analysis when AI is unavailable */
function buildFallbackAnalysis(changedFiles, message, risk, tags) {
  const apis       = changedFiles.filter((f) => /route|controller|api|endpoint/.test(f.file)).length;
  const services   = changedFiles.filter((f) => /service/.test(f.file)).length;
  const tests      = changedFiles.filter((f) => /test|spec/.test(f.file)).length;
  const components = changedFiles.filter((f) => /component|view|page/.test(f.file)).length;

  const concerns = [];
  if (tags.includes('auth')) concerns.push('Authentication flow changed — verify token handling and session security.');
  if (tags.includes('database')) concerns.push('Database schema or queries modified — check migration safety and index coverage.');
  if (tags.includes('api')) concerns.push('API contract changes may break downstream consumers.');
  if (tests === 0 && changedFiles.length > 2) concerns.push('No test files changed — regression test coverage may be insufficient.');
  if (risk === 'HIGH') concerns.push('High-risk change detected — consider additional code review and staged rollout.');

  return {
    summary: `Commit "${message.slice(0, 80)}" modifies ${changedFiles.length} file(s). Overall risk: ${risk}.`,
    apisAffected:        apis,
    servicesAffected:    services,
    testsAffected:       tests,
    componentsAffected:  components,
    concerns,
    recommendations: concerns.length
      ? ['Run full test suite before merging', 'Review all changed API contracts', 'Verify no breaking changes for existing consumers']
      : ['Change appears low-risk — standard review process applies'],
    risk,
    tags,
  };
}
