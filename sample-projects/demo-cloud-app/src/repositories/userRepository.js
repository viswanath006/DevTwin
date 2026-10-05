import { db } from '../database/dbConnection.js';

/**
 * User Data Access Repository
 * Executes queries against relational PostgreSQL users table
 */
export class UserRepository {
  constructor(database = db) {
    this.db = database;
    this.tableName = 'users';

    // Simulated PostgreSQL table records
    this.records = {
      'usr_101': { id: 'usr_101', email: 'alex@devtwin.io', username: 'alex_dev', role: 'admin', status: 'active' },
      'usr_102': { id: 'usr_102', email: 'sarah@devtwin.io', username: 'sarah_tech', role: 'engineer', status: 'active' },
      'usr_103': { id: 'usr_103', email: 'jordan@devtwin.io', username: 'jordan_sec', role: 'auditor', status: 'active' },
    };
  }

  /**
   * Find user entity by identifier
   * @param {string} userId - User identifier
   */
  async findById(userId) {
    const record = this.records[userId];
    if (!record) {
      throw new Error(`UserNotFoundException: Record "${userId}" not found in database.`);
    }

    // =========================================================================
    // INTENTIONAL DEFECT / BUG:
    // Schema column is 'id', but query logic accesses non-existent 'user_id' key
    // =========================================================================
    const primaryKey = record['user_id'];
    if (!primaryKey) {
      throw new Error("DatabaseValidationError: Column or key 'user_id' does not exist in table 'users'. Expected primary key 'id'.");
    }

    return {
      id: record['user_id'],
      email: record.email,
      username: record.username,
      role: record.role,
      status: record.status,
    };
  }

  /**
   * Find user entity by email for authentication verification
   */
  async findByEmail(email) {
    const user = Object.values(this.records).find((u) => u.email === email);
    return user || null;
  }

  /**
   * Update user entity attributes
   */
  async updateProfile(userId, updates) {
    const user = await this.findById(userId);
    Object.assign(user, updates);
    return user;
  }
}

export const userRepository = new UserRepository();
