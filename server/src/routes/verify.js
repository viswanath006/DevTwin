import { Router } from 'express';
import { testRunner } from '../services/testRunner.js';
import { getFileContent } from '../services/codebaseScanner.js';
import { getAIProvider } from '../services/ai/aiProvider.js';
import { getLastScanResult } from './codebase.js';

const router = Router();

/**
 * GET /api/verify/frameworks
 * Detects available test frameworks and safe test execution commands for the active project
 */
router.get('/frameworks', async (req, res) => {
  try {
    const cachedScan = getLastScanResult();
    const projectPath = req.query.projectPath || cachedScan?.rootPath;
    const frameworks = await testRunner.detectFrameworks(projectPath, cachedScan);

    res.json({
      success: true,
      data: {
        projectPath,
        frameworks,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/verify/run
 * Runs explicit, safe verification in a controlled child process
 * Strictly validates against whitelist (pytest, npm test, mvn test, gradle test, devtwin-verify)
 */
router.post('/run', async (req, res) => {
  try {
    const cachedScan = getLastScanResult();
    const { projectPath, command, testFile, suite } = req.body;
    const effectivePath = projectPath || cachedScan?.rootPath;

    const result = await testRunner.runVerification({
      projectPath: effectivePath,
      command,
      testFile,
      suite,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/verify/generate-tests
 * Generates automated test suite for target module
 */
router.post('/generate-tests', async (req, res) => {
  try {
    const { targetFile, rootPath, requirement } = req.body;

    if (!targetFile) {
      return res.status(400).json({
        success: false,
        error: 'Target file is required to generate test suite.',
      });
    }

    let fileContent = '';
    const cachedScan = getLastScanResult();
    const effectiveRoot = rootPath || cachedScan?.rootPath;

    if (effectiveRoot) {
      try {
        const fileData = await getFileContent(effectiveRoot, targetFile);
        fileContent = fileData.content;
      } catch {
        // Continue
      }
    }

    const provider = getAIProvider();
    const tests = await provider.generateTests({
      targetFile,
      fileContent,
      requirement: requirement || 'Unit test coverage and regression guards',
    });

    res.json({
      success: true,
      data: tests,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
