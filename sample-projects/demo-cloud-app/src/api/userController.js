import { userService } from '../services/userService.js';
import { authService } from '../services/authService.js';
import { db } from '../database/dbConnection.js';

/**
 * User & Authentication API Route Handlers
 * Acts as the entrypoint API layer for frontend clients
 */
export class UserController {
  constructor(uService = userService, aService = authService) {
    this.userService = uService;
    this.authService = aService;
  }

  /**
   * GET /api/v1/users/:id
   * Endpoint handler to retrieve user profile
   */
  async getUser(req, res) {
    try {
      const { id } = req.params;
      const profile = await this.userService.getUserProfile(id);
      return res.status(200).json({ success: true, data: profile });
    } catch (err) {
      // Produces realistic 500 Internal Server Error when repository lookup fails
      return res.status(500).json({
        success: false,
        error: `500 Internal Server Error: ${err.message}`,
        code: 'ERR_DATABASE_VALIDATION',
      });
    }
  }

  /**
   * POST /api/v1/auth/login
   * Endpoint handler to authenticate credentials
   */
  async login(req, res) {
    try {
      const { email, password } = req.body || {};
      const session = await this.authService.login(email, password);
      return res.status(200).json({ success: true, data: session });
    } catch (err) {
      return res.status(401).json({ success: false, error: err.message });
    }
  }

  /**
   * PUT /api/v1/users/:id/profile
   * Endpoint handler to update profile attributes
   */
  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const result = await this.userService.updateUserProfile(id, req.body);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/v1/system/health
   * System health check endpoint
   */
  async health(req, res) {
    return res.status(200).json({
      status: 'healthy',
      service: 'user-service-cluster',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * GET /api/v1/users/:id/raw-metrics
   * Architecture Drift Violation: Controller queries database connection directly,
   * bypassing both UserService and UserRepository architectural layers.
   */
  async getRawUserMetrics(req, res) {
    try {
      const metrics = await db.query('SELECT count(*) as total_users FROM users WHERE status = $1', ['active']);
      return res.status(200).json({ success: true, data: metrics });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const userController = new UserController();
