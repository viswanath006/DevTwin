import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { scanCodebase, getFileContent } from '../services/codebaseScanner.js';
import { buildDependencyGraph } from '../services/dependencyGraph.js';
import { analyzeCodebaseDeep } from '../services/codebaseAnalyzer.js';
import { getAIProvider } from '../services/ai/aiProvider.js';
import { calculateCodebaseHealthScore } from '../services/healthScore.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROJECT_PATH = path.resolve(__dirname, '../../../');
const DEMO_PROJECT_PATH = path.resolve(__dirname, '../../../sample-projects/demo-cloud-app');
const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

// In-memory cache of last scanned repository
let lastScanResult = null;

/**
 * POST /api/codebase/demo
 * Loads the built-in realistic sample project (SaaS app with frontend/API, auth, user, db, and tests)
 * Executes through the exact same scanning, AST parsing, and AI analysis pipeline as normal codebases.
 */
router.post('/demo', async (req, res) => {
  try {
    const scanData = await scanCodebase(DEMO_PROJECT_PATH);
    const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
    const deepAnalysis = await analyzeCodebaseDeep(scanData.rootPath, scanData);

    const provider = getAIProvider();
    const aiArchitecture = await provider.analyzeArchitecture(deepAnalysis);

    const demoContext = {
      ...deepAnalysis,
      isDemo: true,
      demoScenario: {
        title: '500 Internal Server Error (Database Key Error)',
        error: "500 Internal Server Error: DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'. Expected primary key 'id'.",
        logs: `500 Internal Server Error: DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'. Expected primary key 'id'.\n    at UserRepository.findById (src/repositories/userRepository.js:34:13)\n    at UserService.getUserProfile (src/services/userService.js:18:38)\n    at userController.getUser (src/api/userController.js:19:35)\n    at Layer.handle [as handle_request] (express/router/layer.js:95:5)`,
        targetFile: 'src/repositories/userRepository.js',
        testCommand: 'devtwin-verify all',
      },
      aiArchitecture,
      graph,
    };

    const healthScore = await calculateCodebaseHealthScore({
      projectContext: demoContext,
      scanData: demoContext,
    });

    lastScanResult = {
      ...demoContext,
      healthScore,
    };

    res.json({
      success: true,
      data: lastScanResult,
    });
  } catch (err) {
    console.error('[Demo Project Load Error]:', err);
    res.status(500).json({
      success: false,
      error: `Failed to load demo project: ${err.message}`,
    });
  }
});

/**
 * POST /api/codebase/scan
 * Scans local directory, extracts symbols, APIs, dependencies, tests, and architecture
 */
router.post('/scan', async (req, res) => {
  try {
    const targetPath = req.body?.path?.trim() || DEFAULT_PROJECT_PATH;
    const scanData = await scanCodebase(targetPath);
    const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
    const deepAnalysis = await analyzeCodebaseDeep(scanData.rootPath, scanData);

    // Generate grounded AI architecture understanding
    const provider = getAIProvider();
    const aiArchitecture = await provider.analyzeArchitecture(deepAnalysis);

    const scanContext = {
      ...deepAnalysis,
      aiArchitecture,
      graph,
    };

    const healthScore = await calculateCodebaseHealthScore({
      projectContext: scanContext,
      scanData: scanContext,
    });

    lastScanResult = {
      ...scanContext,
      healthScore,
    };

    res.json({
      success: true,
      data: lastScanResult,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/codebase/upload
 * Handles folder or multi-file upload from browser, saves to local temp folder, and analyzes
 */
router.post('/upload', async (req, res) => {
  try {
    const { projectName = 'uploaded-project', files = [] } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided in upload.' });
    }

    // Clean project folder name
    const sanitizedProjectName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uploadTargetPath = path.join(UPLOADS_DIR, `${Date.now()}_${sanitizedProjectName}`);

    // Ensure uploads directory exists
    await fs.mkdir(uploadTargetPath, { recursive: true });

    // Write all uploaded files to disk
    for (const f of files) {
      if (!f.path || typeof f.content !== 'string') continue;
      // Prevent directory traversal
      const safeRelative = f.path.replace(/^(\.\.(\/|\\|$))+/, '');
      const fullFilePath = path.join(uploadTargetPath, safeRelative);
      await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
      await fs.writeFile(fullFilePath, f.content, 'utf-8');
    }

    // Scan and analyze the newly written uploaded project
    const scanData = await scanCodebase(uploadTargetPath);
    const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
    const deepAnalysis = await analyzeCodebaseDeep(scanData.rootPath, scanData);

    const provider = getAIProvider();
    const aiArchitecture = await provider.analyzeArchitecture(deepAnalysis);

    const uploadContext = {
      ...deepAnalysis,
      aiArchitecture,
      graph,
    };

    const healthScore = await calculateCodebaseHealthScore({
      projectContext: uploadContext,
      scanData: uploadContext,
    });

    lastScanResult = {
      ...uploadContext,
      healthScore,
    };

    res.json({
      success: true,
      data: lastScanResult,
    });
  } catch (err) {
    console.error('Upload analysis error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/codebase/health-score
 * Returns current codebase health score breakdown
 */
router.get('/health-score', async (req, res) => {
  try {
    if (!lastScanResult) {
      return res.status(404).json({ success: false, error: 'No active codebase scanned.' });
    }
    if (!lastScanResult.healthScore) {
      lastScanResult.healthScore = await calculateCodebaseHealthScore({
        projectContext: lastScanResult,
        scanData: lastScanResult,
      });
    }
    res.json({ success: true, data: lastScanResult.healthScore });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/codebase/health-score
 * Recalculates health score with optional updated verification or security state
 */
router.post('/health-score', async (req, res) => {
  try {
    const { rootPath, verificationResults, securityResults } = req.body || {};
    let context = lastScanResult;

    if (rootPath && (!lastScanResult || lastScanResult.rootPath !== rootPath)) {
      const scanData = await scanCodebase(rootPath);
      const graph = await buildDependencyGraph(scanData.rootPath, scanData.stats.fileList);
      context = await analyzeCodebaseDeep(scanData.rootPath, scanData);
      context.graph = graph;
    }

    if (!context) {
      return res.status(400).json({ success: false, error: 'No active codebase scanned.' });
    }

    const healthScore = await calculateCodebaseHealthScore({
      projectContext: context,
      scanData: context,
      securityResults,
      verificationResults,
    });

    if (lastScanResult) {
      lastScanResult.healthScore = healthScore;
    }

    res.json({ success: true, data: healthScore });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/codebase/ai-architecture
 * Generates or refreshes structured AI architecture understanding from project context
 */
router.post('/ai-architecture', async (req, res) => {
  try {
    const context = req.body?.context || lastScanResult;

    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'No active project context found. Please scan a codebase first.',
      });
    }

    const provider = getAIProvider();
    const aiArchitecture = await provider.analyzeArchitecture(context);

    if (lastScanResult) {
      lastScanResult.aiArchitecture = aiArchitecture;
    }

    res.json({
      success: true,
      data: aiArchitecture,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/codebase/file
 * Returns raw content of a specific file
 */
router.get('/file', async (req, res) => {
  try {
    const { rootPath, filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Missing filePath parameter' });
    }

    const targetRoot = rootPath || lastScanResult?.rootPath || DEFAULT_PROJECT_PATH;
    const fileData = await getFileContent(targetRoot, filePath);

    res.json({
      success: true,
      data: fileData,
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/codebase/query
 * Ask digital twin about architecture, dependencies, or APIs
 */
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    const stats = lastScanResult?.stats || { totalFiles: 0, languages: {} };
    const fileTree = lastScanResult?.tree || [];

    const provider = getAIProvider();
    const analysis = await provider.analyzeCodebase({ stats, query, fileTree });

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export function getLastScanResult() {
  return lastScanResult;
}

export default router;

