import express from 'express';
import cors from 'cors';
import { config } from './config.js';

import healthRoutes from './routes/health.js';
import codebaseRoutes from './routes/codebase.js';
import debugRoutes from './routes/debug.js';
import impactRoutes from './routes/impact.js';
import verifyRoutes from './routes/verify.js';
import securityRoutes from './routes/security.js';
import reviewRoutes from './routes/review.js';
import askRoutes from './routes/ask.js';
import gitRoutes from './routes/git.js';
import architectureRoutes from './routes/architecture.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow local frontend during development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Request logger for development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/codebase', codebaseRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/ask', askRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/architecture', architectureRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DevTwin API',
    description: 'Codebase Digital Twin Server',
    status: 'online',
    endpoints: [
      '/api/health',
      '/api/codebase/scan',
      '/api/codebase/file',
      '/api/codebase/query',
      '/api/debug/root-cause',
      '/api/impact/analyze',
      '/api/verify/generate-tests',
      '/api/verify/run',
      '/api/security/scan',
      '/api/security/latest',
      '/api/review/analyze',
      '/api/review/latest',
      '/api/ask',
      '/api/ask/suggestions',
      '/api/git/info',
      '/api/git/analyze',
    ],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[DevTwin Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 DevTwin Server running at http://localhost:${config.port}`);
  console.log(`📡 AI Provider: ${config.aiProvider.toUpperCase()}`);
  console.log(`🔗 Health Check: http://localhost:${config.port}/api/health`);
  console.log('====================================================');
});
