/**
 * Phase 15: Git Intelligence Routes
 * GET  /api/git/info        — branch, commits, working status, hot files, risk stats
 * POST /api/git/analyze     — AI deep-dive on a single commit
 */

import { Router } from 'express';
import { getGitIntelligence, analyzeCommit } from '../services/gitIntelligence.js';
import { getLastScanResult } from './codebase.js';

const router = Router();

/** Last successful git intelligence result (in-memory cache) */
let lastGitResult = null;

/**
 * GET /api/git/info
 * Reads real git data from the currently scanned repository.
 */
router.get('/info', async (req, res) => {
  try {
    const projectContext = getLastScanResult() || {};
    const rootPath = req.query.rootPath || projectContext.rootPath;

    if (!rootPath) {
      return res.status(400).json({
        success: false,
        error: 'No repository path available. Please scan a project first.',
      });
    }

    const result = await getGitIntelligence({ rootPath, projectContext });
    lastGitResult = result;

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Git Intelligence Error]:', err);
    res.status(500).json({
      success: false,
      error: `Git Intelligence failed: ${err.message}`,
    });
  }
});

/**
 * GET /api/git/latest
 * Returns the cached last git intelligence result.
 */
router.get('/latest', (req, res) => {
  if (!lastGitResult) {
    return res.json({
      success: false,
      error: 'No git intelligence data yet. Call GET /api/git/info first.',
    });
  }
  res.json({ success: true, data: lastGitResult });
});

/**
 * POST /api/git/analyze
 * AI-powered deep analysis for a specific commit.
 * Body: { hash: string, rootPath?: string }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { hash, rootPath: bodyPath } = req.body || {};

    if (!hash || typeof hash !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field "hash". Provide the commit hash to analyze.',
      });
    }

    const projectContext = getLastScanResult() || {};
    const rootPath = bodyPath || projectContext.rootPath;

    if (!rootPath) {
      return res.status(400).json({
        success: false,
        error: 'No repository path available. Please scan a project first.',
      });
    }

    const result = await analyzeCommit({ hash, rootPath, projectContext });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Git Analyze Commit Error]:', err);
    res.status(500).json({
      success: false,
      error: `Commit analysis failed: ${err.message}`,
    });
  }
});

export default router;
