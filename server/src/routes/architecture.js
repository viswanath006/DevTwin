import { Router } from 'express';
import { getLastScanResult } from './codebase.js';
import { detectArchitectureDrift, DEFAULT_ARCHITECTURE_RULES } from '../services/architectureDrift.js';
import { scanCodebase } from '../services/codebaseScanner.js';
import { buildDependencyGraph } from '../services/dependencyGraph.js';
import { analyzeCodebaseDeep } from '../services/codebaseAnalyzer.js';

const router = Router();

// In-memory custom rules store
let customRules = [...DEFAULT_ARCHITECTURE_RULES];

/**
 * GET /api/architecture/rules
 * Returns active architecture rules and presets
 */
router.get('/rules', (req, res) => {
  res.json({
    success: true,
    data: customRules,
  });
});

/**
 * POST /api/architecture/rules
 * Updates or adds architecture rules
 */
router.post('/rules', (req, res) => {
  try {
    const { rules, reset } = req.body;
    if (reset) {
      customRules = [...DEFAULT_ARCHITECTURE_RULES];
    } else if (Array.isArray(rules)) {
      customRules = rules;
    }
    res.json({
      success: true,
      data: customRules,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/architecture/drift
 * Evaluates active project context against architecture rules
 */
router.post('/drift', async (req, res) => {
  try {
    const { rootPath, rules: overrideRules } = req.body || {};
    let projectContext = getLastScanResult();

    if ((!projectContext || (rootPath && projectContext.rootPath !== rootPath)) && rootPath) {
      const scanData = await scanCodebase(rootPath);
      const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
      projectContext = await analyzeCodebaseDeep(scanData.rootPath, scanData);
      projectContext.graph = graph;
    }

    if (!projectContext) {
      return res.status(400).json({
        success: false,
        error: 'No active project scanned. Please scan a repository or load the demo project first.',
      });
    }

    const rulesToUse = overrideRules || customRules;
    const driftReport = await detectArchitectureDrift({
      projectContext,
      graph: projectContext.graph,
      rules: rulesToUse,
      rootPath: projectContext.rootPath,
    });

    res.json({
      success: true,
      data: driftReport,
    });
  } catch (err) {
    console.error('[Architecture Drift Error]:', err);
    res.status(500).json({
      success: false,
      error: `Failed to detect architecture drift: ${err.message}`,
    });
  }
});

/**
 * GET /api/architecture/drift
 * Convenience GET endpoint using cached scan result
 */
router.get('/drift', async (req, res) => {
  try {
    const projectContext = getLastScanResult();
    if (!projectContext) {
      return res.status(400).json({
        success: false,
        error: 'No active project scanned. Please scan a repository or load the demo project first.',
      });
    }

    const driftReport = await detectArchitectureDrift({
      projectContext,
      graph: projectContext.graph,
      rules: customRules,
      rootPath: projectContext.rootPath,
    });

    res.json({
      success: true,
      data: driftReport,
    });
  } catch (err) {
    console.error('[Architecture Drift Error]:', err);
    res.status(500).json({
      success: false,
      error: `Failed to detect architecture drift: ${err.message}`,
    });
  }
});

export default router;
