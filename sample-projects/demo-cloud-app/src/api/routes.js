import { Router } from 'express';
import { userController } from './userController.js';

export const router = Router();

// ============================================================================
// Public & Protected REST API Gateway Endpoints
// ============================================================================

// Authentication endpoints
router.post('/api/v1/auth/login', (req, res) => userController.login(req, res));

// User profile endpoints (triggers user service and database repository)
router.get('/api/v1/users/:id', (req, res) => userController.getUser(req, res));
router.put('/api/v1/users/:id/profile', (req, res) => userController.updateProfile(req, res));

// System health check
router.get('/api/v1/system/health', (req, res) => userController.health(req, res));

// Direct DB metrics endpoint (Architecture Drift violation)
router.get('/api/v1/users/:id/raw-metrics', (req, res) => userController.getRawUserMetrics(req, res));

export default router;
