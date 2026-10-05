import { Router } from 'express';
import { askCodebase } from '../services/askCodebase.js';
import { getLastScanResult } from './codebase.js';

const router = Router();

// Store query history in memory
const queryHistory = [];

/**
 * POST /api/ask
 * Grounded codebase Q&A using DevTwin indexed AST & project context
 */
router.post('/', async (req, res) => {
  try {
    const { question, rootPath } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field "question". Please provide a question about the codebase.',
      });
    }

    const projectContext = getLastScanResult() || {};
    const targetRoot = rootPath || projectContext.rootPath;

    const result = await askCodebase({
      question: question.trim(),
      projectContext,
      rootPath: targetRoot,
    });

    // Record in history (max 30 items)
    queryHistory.unshift({
      question: question.trim(),
      answerPreview: result.answer?.slice(0, 100),
      timestamp: result.timestamp,
      relevantFilesCount: result.relevantFiles?.length || 0,
    });
    if (queryHistory.length > 30) queryHistory.pop();

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[Ask Codebase Error]:', err);
    res.status(500).json({
      success: false,
      error: `Failed to answer question: ${err.message}`,
    });
  }
});

/**
 * GET /api/ask/suggestions
 * Returns suggested prompt questions dynamically tailored to the indexed project
 */
router.get('/suggestions', (req, res) => {
  const projectContext = getLastScanResult() || {};
  const apis = projectContext.apis || [];
  const files = projectContext.stats?.fileList || [];

  const defaultSuggestions = [
    'How does authentication work?',
    'Where is the login API implemented?',
    'Which files depend on UserService?',
    'What happens when a user creates an account?',
    'Which APIs use this database?',
    'What will happen if I change this function?',
    'Where are errors handled?',
    'Which tests cover this component?',
  ];

  res.json({
    success: true,
    data: {
      suggestions: defaultSuggestions,
      history: queryHistory.slice(0, 10),
      hasContext: Boolean(projectContext.stats),
      projectFilesCount: files.length,
      apisCount: apis.length,
    },
  });
});

export default router;
