import { Router } from 'express';
import { computeBlastRadius, buildDependencyGraph } from '../services/dependencyGraph.js';
import { scanCodebase } from '../services/codebaseScanner.js';
import { analyzeCodebaseDeep } from '../services/codebaseAnalyzer.js';
import { getAIProvider } from '../services/ai/aiProvider.js';
import { getLastScanResult } from './codebase.js';
import { simulateWhatIfChange } from '../services/whatIfSimulator.js';

const router = Router();

/**
 * POST /api/impact/analyze
 * Predict what may be affected by a proposed code change
 * Accepts: targetFile, changedCode, proposedDiff, intent, rootPath, graph, projectContext
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      targetFile,
      changedCode,
      proposedDiff,
      intent,
      rootPath,
      graph: providedGraph,
      projectContext: providedContext,
    } = req.body;

    if (!targetFile && !proposedDiff && !changedCode && !intent) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a target file, changed code, git diff, or description of the intended change.',
      });
    }

    // 1. Resolve Project Context & Dependency Graph
    let projectContext = providedContext || null;
    let graph = providedGraph || null;

    // Check cached scan result if available
    const cachedScan = getLastScanResult();
    if (!projectContext && cachedScan) {
      projectContext = cachedScan;
      if (!graph && cachedScan.graph) {
        graph = cachedScan.graph;
      }
    }

    // If rootPath provided or needed and still not found
    if ((!projectContext || !graph) && rootPath) {
      try {
        const scanData = await scanCodebase(rootPath);
        graph = graph || (await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList));
        projectContext = projectContext || (await analyzeCodebaseDeep(scanData.rootPath, scanData));
      } catch (scanErr) {
        console.warn('[ImpactAnalyzer] Could not scan rootPath:', scanErr.message);
      }
    }

    // 2. Call AI Provider for Impact Analysis
    const provider = getAIProvider();
    const impactResult = await provider.analyzeImpact({
      targetFile,
      proposedDiff,
      changedCode,
      intent,
      graph: graph || {},
      projectContext: projectContext || {},
    });

    // 3. Compute blast radius score if targetFile is resolved
    let blastRadiusScore = 15;
    if (impactResult.targetFile && graph && graph[impactResult.targetFile]) {
      const structuralRadius = computeBlastRadius(graph, impactResult.targetFile);
      blastRadiusScore = structuralRadius.riskScore || 25;
    } else if (impactResult.riskLevel === 'CRITICAL') {
      blastRadiusScore = 85;
    } else if (impactResult.riskLevel === 'HIGH') {
      blastRadiusScore = 65;
    } else if (impactResult.riskLevel === 'MEDIUM') {
      blastRadiusScore = 40;
    }

    // 4. Counts breakdown
    const affectedFiles = impactResult.affectedFiles || [];
    const affectedComponents = impactResult.affectedComponents || [];
    const affectedAPIs = impactResult.affectedAPIs || [];
    const affectedTests = impactResult.affectedTests || [];

    const counts = {
      files: affectedFiles.length,
      apis: affectedAPIs.length,
      services: affectedComponents.length,
      tests: affectedTests.length,
    };

    res.json({
      success: true,
      data: {
        targetFile: impactResult.targetFile || targetFile || 'Inferred from change',
        riskLevel: impactResult.riskLevel || 'LOW',
        blastRadiusScore,
        affectedFiles,
        affectedComponents,
        affectedAPIs,
        affectedTests,
        reasoning: impactResult.reasoning || 'No analysis reasoning generated.',
        recommendedTests: impactResult.recommendedTests || [],
        recommendedAction: impactResult.recommendedAction || (
          impactResult.riskLevel === 'CRITICAL' || impactResult.riskLevel === 'HIGH'
            ? `High-risk blast radius detected. Run targeted regression tests and verify downstream contracts before deployment.`
            : `Run standard unit test suite to verify code change integrity.`
        ),
        counts,
        evidenceBreakdown: {
          confirmed: affectedFiles.filter((f) => (typeof f === 'object' ? f.confidence === 'Confirmed' : false)).length,
          likely: affectedFiles.filter((f) => (typeof f === 'object' ? f.confidence === 'Likely' : false)).length,
          possible: affectedFiles.filter((f) => (typeof f === 'object' ? f.confidence === 'Possible' : false)).length,
        },
      },
    });
  } catch (err) {
    console.error('[ImpactAnalyzer Error]', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/impact/what-if
 * Phase 17: Predictive Change Simulation ("What-If Analysis")
 * Allows developers to describe proposed changes and predicts impact without modifying actual code.
 */
router.post('/what-if', async (req, res) => {
  try {
    const { proposedChange, rootPath, projectContext: providedContext } = req.body;

    if (!proposedChange || !proposedChange.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please describe the proposed change (e.g. "I want to replace JWT authentication with OAuth.")',
      });
    }

    let projectContext = providedContext || getLastScanResult();

    if ((!projectContext || (rootPath && projectContext.rootPath !== rootPath)) && rootPath) {
      const scanData = await scanCodebase(rootPath);
      const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
      projectContext = await analyzeCodebaseDeep(scanData.rootPath, scanData);
      projectContext.graph = graph;
    }

    if (!projectContext) {
      return res.status(400).json({
        success: false,
        error: 'No active project context found. Please scan a codebase or load the demo project first.',
      });
    }

    const provider = getAIProvider();
    const simulationResult = await simulateWhatIfChange({
      proposedChange,
      projectContext,
      graph: projectContext.graph || {},
      aiProvider: provider,
    });

    res.json({
      success: true,
      data: simulationResult,
    });
  } catch (err) {
    console.error('[What-If Simulation Error]:', err);
    res.status(500).json({
      success: false,
      error: `Failed to simulate change impact: ${err.message}`,
    });
  }
});

export default router;
