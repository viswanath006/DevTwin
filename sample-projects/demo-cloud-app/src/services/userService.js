import { userRepository } from '../repositories/userRepository.js';

/**
 * User Domain Business Service
 * Encapsulates user profile logic, data enrichment, and permissions
 */
export class UserService {
  constructor(repo = userRepository) {
    this.repo = repo;
  }

  /**
   * Retrieves enriched user profile
   * @param {string} userId
   */
  async getUserProfile(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('IllegalArgumentException: Invalid userId format.');
    }

    // Call repository layer (triggers repository query)
    const user = await this.repo.findById(userId);

    return {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.role === 'admin' ? ['read', 'write', 'admin'] : ['read'],
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Updates user profile attributes
   */
  async updateUserProfile(userId, profileData) {
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('IllegalArgumentException: Profile update payload must be an object.');
    }

    const updated = await this.repo.updateProfile(userId, profileData);
    return {
      userId: updated.id,
      status: 'updated',
      updatedAt: new Date().toISOString(),
    };
  }
}

export const userService = new UserService();
