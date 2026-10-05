import { Router } from 'express';
import { performCodeReview } from '../services/codeReviewer.js';
import { getAIProvider } from '../services/ai/aiProvider.js';
import { getLastScanResult } from './codebase.js';

const router = Router();

// In-memory cache of last review
let lastReviewResult = null;

/**
 * POST /api/review/analyze
 * Performs AI code review over diff, code snippet, or changed files.
 * Enriches heuristic findings with AI provider (Gemini/OpenAI/Mock).
 */
router.post('/analyze', async (req, res) => {
  try {
    const { diff, changedFiles, codeSnippet, prDescription, rootPath } = req.body || {};

    // Use cached project context for architecture-aware review
    const projectContext = getLastScanResult() || {};
    const targetRoot = rootPath || projectContext.rootPath;

    // 1. Heuristic review (always runs, no API key required)
    const reviewResult = await performCodeReview({
      diff,
      changedFiles: changedFiles || [],
      codeSnippet,
      prDescription,
      rootPath: targetRoot,
      projectContext,
    });

    // 2. AI provider enrichment (optional, enhances findings)
    try {
      const provider = getAIProvider();
      if (provider && typeof provider.reviewCode === 'function') {
        const aiEnrichment = await provider.reviewCode({
          diff,
          changedFiles,
          codeSnippet,
          prDescription,
          heuristicFindings: reviewResult.findings,
          projectContext,
        });
        if (aiEnrichment?.findings?.length > 0) {
          // Merge AI findings (deduplicate by id)
          const existingIds = new Set(reviewResult.findings.map((f) => f.id));
          for (const aif of aiEnrichment.findings) {
            if (!existingIds.has(aif.id)) {
              reviewResult.findings.push(aif);
              existingIds.add(aif.id);
            }
          }
          // Re-sort
          const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
          reviewResult.findings.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
        }
        if (aiEnrichment?.summary) {
          reviewResult.aiSummary = aiEnrichment.summary;
        }
        if (aiEnrichment?.overallRisk) {
          // Use worst-case risk
          const riskRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 };
          if ((riskRank[aiEnrichment.overallRisk] || 0) > (riskRank[reviewResult.overallRisk] || 0)) {
            reviewResult.overallRisk = aiEnrichment.overallRisk;
          }
        }
      }
    } catch (aiErr) {
      console.warn('[Code Review AI Enrichment Notice]:', aiErr.message);
    }

    // Recount stats after merge
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of reviewResult.findings) {
      const key = f.severity?.toLowerCase();
      if (key && key in counts) counts[key]++;
    }
    reviewResult.stats = { totalFindings: reviewResult.findings.length, ...counts };

    lastReviewResult = {
      reviewedAt: new Date().toISOString(),
      rootPath: targetRoot,
      ...reviewResult,
    };

    res.json({ success: true, data: lastReviewResult });
  } catch (err) {
    console.error('[Code Review Error]:', err);
    res.status(500).json({
      success: false,
      error: `Code review failed: ${err.message}`,
    });
  }
});

/**
 * GET /api/review/latest
 * Returns the last executed code review result.
 */
router.get('/latest', (req, res) => {
  if (!lastReviewResult) {
    return res.status(404).json({
      success: false,
      error: 'No code review results available. Run POST /api/review/analyze first.',
    });
  }
  res.json({ success: true, data: lastReviewResult });
});

export function getLastReviewResult() {
  return lastReviewResult;
}

export default router;
