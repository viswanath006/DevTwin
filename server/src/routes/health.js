import { Router } from 'express';
import { getAIProvider } from '../services/ai/aiProvider.js';

const router = Router();

router.get('/', (req, res) => {
  const provider = getAIProvider();
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    aiProvider: provider.name,
    version: '1.0.0'
  });
});

export default router;
