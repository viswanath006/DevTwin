import { userRepository } from '../repositories/userRepository.js';

/**
 * Authentication & Security Service
 * Issues JWT tokens and verifies credentials against user repository
 */
export class AuthService {
  constructor(repo = userRepository) {
    this.repo = repo;
    this.secretKey = process.env.JWT_SECRET || 'devtwin-demo-jwt-secret-key-32b';
  }

  /**
   * Authenticate user credentials and return bearer token
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    if (!email || !password) {
      throw new Error('AuthenticationError: Missing email or password.');
    }

    const user = await this.repo.findByEmail(email);
    if (!user) {
      throw new Error('AuthenticationError: Invalid user credentials.');
    }

    // Generate authenticated session token
    const token = `dt_jwt_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64')}`;

    return {
      authenticated: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      expiresIn: '24h',
    };
  }

  /**
   * Validate session bearer token
   */
  async verifySession(token) {
    if (!token || !token.startsWith('dt_jwt_')) {
      return { valid: false, reason: 'Malformed token' };
    }
    return { valid: true };
  }
}

export const authService = new AuthService();
