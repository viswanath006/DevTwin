import { Router } from 'express';
import { runSecurityScan } from '../services/securityScanner.js';
import { scanCodebase } from '../services/codebaseScanner.js';
import { buildDependencyGraph } from '../services/dependencyGraph.js';
import { analyzeCodebaseDeep } from '../services/codebaseAnalyzer.js';
import { getAIProvider } from '../services/ai/aiProvider.js';
import { getLastScanResult } from './codebase.js';

const router = Router();

// In-memory cache of last security scan
let lastSecurityScanResult = null;

/**
 * POST /api/security/scan
 * Runs AST and static security audit on indexed codebase
 * Strictly grounded in real file and dependency evidence
 */
router.post('/scan', async (req, res) => {
  try {
    const { rootPath } = req.body || {};

    // 1. Resolve Project Context & Graph from cache or scan
    let projectContext = null;
    let graph = null;

    const cachedScan = getLastScanResult();
    if (cachedScan && (!rootPath || cachedScan.rootPath === rootPath)) {
      projectContext = cachedScan;
      graph = cachedScan.graph;
    }

    if (!projectContext && rootPath) {
      const scanData = await scanCodebase(rootPath);
      graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
      projectContext = await analyzeCodebaseDeep(scanData.rootPath, scanData);
    } else if (!projectContext && cachedScan) {
      projectContext = cachedScan;
      graph = cachedScan.graph;
    }

    if (!projectContext) {
      return res.status(400).json({
        success: false,
        error: 'No active codebase indexed. Please scan a project first or provide a valid rootPath.',
      });
    }

    // 2. Run Grounded Security Scanner Engine
    const targetRoot = rootPath || projectContext.rootPath;
    const scanResults = await runSecurityScan({
      rootPath: targetRoot,
      projectContext,
      graph: graph || {},
    });

    // 3. Enrich with AI Provider Synthesis (optional executive threat intelligence)
    try {
      const provider = getAIProvider();
      if (provider && typeof provider.analyzeSecurity === 'function') {
        const aiEnrichment = await provider.analyzeSecurity({
          findings: scanResults.findings,
          projectContext,
          score: scanResults.score,
          counts: scanResults.counts,
        });
        if (aiEnrichment?.summary) {
          scanResults.aiSummary = aiEnrichment.summary;
        }
        if (aiEnrichment?.threatPosture) {
          scanResults.threatPosture = aiEnrichment.threatPosture;
        }
      }
    } catch (aiErr) {
      console.warn('[Security AI Provider Enrichment Notice]:', aiErr.message);
    }

    lastSecurityScanResult = {
      rootPath: targetRoot,
      timestamp: new Date().toISOString(),
      ...scanResults,
    };

    res.json({
      success: true,
      data: lastSecurityScanResult,
    });
  } catch (err) {
    console.error('[Security Scanner Error]:', err);
    res.status(500).json({
      success: false,
      error: `Security scan failed: ${err.message}`,
    });
  }
});

/**
 * GET /api/security/latest
 * Returns last executed security audit result
 */
router.get('/latest', (req, res) => {
  if (!lastSecurityScanResult) {
    return res.status(404).json({
      success: false,
      error: 'No security scan results available. Run POST /api/security/scan first.',
    });
  }
  res.json({
    success: true,
    data: lastSecurityScanResult,
  });
});

export function getLastSecurityScanResult() {
  return lastSecurityScanResult;
}

export default router;
