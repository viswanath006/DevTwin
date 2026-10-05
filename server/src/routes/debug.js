import { Router } from 'express';
import { getFileContent, scanCodebase } from '../services/codebaseScanner.js';
import { buildDependencyGraph } from '../services/dependencyGraph.js';
import { analyzeCodebaseDeep } from '../services/codebaseAnalyzer.js';
import { getAIProvider } from '../services/ai/aiProvider.js';

const router = Router();

/**
 * POST /api/debug/root-cause
 * Pinpoint culprit file and lines, trace dependency chain, diagnose defect, and output unified patch
 */
router.post('/root-cause', async (req, res) => {
  try {
    const { error, logs, stackTrace, targetFile, rootPath } = req.body;

    if (!error && !stackTrace && !logs) {
      return res.status(400).json({
        success: false,
        error: 'An "error" message, "logs", or "stackTrace" is required for debugging.',
      });
    }

    // Retrieve or assemble project context
    let projectContext = null;
    let graph = {};

    if (rootPath) {
      try {
        const scanData = await scanCodebase(rootPath);
        graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
        projectContext = await analyzeCodebaseDeep(scanData.rootPath, scanData);
      } catch (scanErr) {
        console.warn('[Debugger] Could not scan rootPath for context:', scanErr.message);
      }
    }

    let fileContext = '';
    if (targetFile && rootPath) {
      try {
        const fileData = await getFileContent(rootPath, targetFile);
        fileContext = fileData.content;
      } catch {
        // Continue even if file cannot be read directly
      }
    }

    const provider = getAIProvider();
    const diagnosis = await provider.debugRootCause({
      error: error || 'Unhandled Exception',
      logs: logs || '',
      stackTrace: stackTrace || '',
      targetFile,
      rootPath,
      fileContext,
      projectContext,
      graph,
    });

    res.json({
      success: true,
      data: diagnosis,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
