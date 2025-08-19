import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import { UserService } from './userService';
import { User, LoginCredentials, RegisterData } from '../../../shared/types';
import { ValidationError, AuthenticationError } from '../middleware/errorHandler';
import { generateAccessToken, generateRefreshToken, blacklistToken } from '../middleware/auth';

const database = getDatabase();

export class AuthService {
  // Register a new user
  static async register(userData: RegisterData): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, username, displayName, password } = userData;

    // Validate input
    if (!email || !username || !displayName || !password) {
      throw new ValidationError('All fields are required');
    }

    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }

    if (username.length < 3) {
      throw new ValidationError('Username must be at least 3 characters long');
    }

    // Create user
    const user = await UserService.createUser({
      email,
      username,
      displayName,
      password,
      bio: ''
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    // Update last login
    await UserService.updateLastLogin(user.id);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  // Login user
  static async login(credentials: LoginCredentials): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = credentials;

    // Validate input
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // Find user by email
    const user = await UserService.getUserByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await UserService.verifyPassword(user.id, password);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    // Update last login
    await UserService.updateLastLogin(user.id);

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      
      // Check if refresh token exists in database
      const tokenExists = await this.verifyRefreshToken(decoded.userId, refreshToken);
      if (!tokenExists) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Get user
      const user = await UserService.getUserById(decoded.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Store new refresh token and remove old one
      await this.replaceRefreshToken(decoded.userId, refreshToken, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw error;
    }
  }

  // Logout user
  static async logout(userId: string, accessToken: string, refreshToken: string): Promise<void> {
    // Blacklist access token
    const decoded = jwt.decode(accessToken) as any;
    if (decoded && decoded.exp) {
      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      await blacklistToken(accessToken, expiresIn);
    }

    // Remove refresh token from database
    await this.removeRefreshToken(userId, refreshToken);
  }

  // Change password
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Validate new password
    if (newPassword.length < 6) {
      throw new ValidationError('New password must be at least 6 characters long');
    }

    // Verify current password
    const isValidPassword = await UserService.verifyPassword(userId, currentPassword);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    await UserService.updatePassword(userId, newPassword);

    // Invalidate all refresh tokens for this user
    await this.invalidateAllRefreshTokens(userId);
  }

  // Reset password (forgot password)
  static async requestPasswordReset(email: string): Promise<void> {
    const user = await UserService.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Store reset token
    await database.query(
      `UPDATE users 
       SET password_reset_token = $1, password_reset_expires = NOW() + INTERVAL '1 hour'
       WHERE id = $2`,
      [resetToken, user.id]
    );

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new AuthenticationError('Invalid reset token');
      }

      // Check if token exists and is not expired
      const result = await database.query(
        `SELECT id FROM users 
         WHERE id = $1 AND password_reset_token = $2 AND password_reset_expires > NOW()`,
        [decoded.userId, token]
      );

      if (result.rows.length === 0) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      // Validate new password
      if (newPassword.length < 6) {
        throw new ValidationError('New password must be at least 6 characters long');
      }

      // Update password and clear reset token
      await database.query(
        `UPDATE users 
         SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [await bcrypt.hash(newPassword, 12), decoded.userId]
      );

      // Invalidate all refresh tokens
      await this.invalidateAllRefreshTokens(decoded.userId);

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid reset token');
      }
      throw error;
    }
  }

  // Verify email
  static async verifyEmail(token: string): Promise<void> {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'email_verification') {
        throw new AuthenticationError('Invalid verification token');
      }

      // Update user email verification status
      const result = await database.query(
        `UPDATE users 
         SET email_verified = true, email_verification_token = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND email_verification_token = $2`,
        [decoded.userId, token]
      );

      if (result.rowCount === 0) {
        throw new AuthenticationError('Invalid verification token');
      }

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid verification token');
      }
      throw error;
    }
  }

  // Send email verification
  static async sendEmailVerification(userId: string): Promise<void> {
    const user = await UserService.getUserById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    if (user.isVerified) {
      throw new ValidationError('Email already verified');
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, type: 'email_verification' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Store verification token
    await database.query(
      `UPDATE users 
       SET email_verification_token = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [verificationToken, userId]
    );

    // TODO: Send email with verification link
    console.log(`Email verification token for ${user.email}: ${verificationToken}`);
  }

  // Helper methods for refresh token management
  private static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await database.query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, refreshToken, expiresAt]
    );
  }

  private static async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const result = await database.query(
      `SELECT id FROM user_sessions 
       WHERE user_id = $1 AND refresh_token = $2 AND expires_at > NOW()`,
      [userId, refreshToken]
    );

    return result.rows.length > 0;
  }

  private static async replaceRefreshToken(userId: string, oldToken: string, newToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await database.query(
      `UPDATE user_sessions 
       SET refresh_token = $1, expires_at = $2
       WHERE user_id = $3 AND refresh_token = $4`,
      [newToken, expiresAt, userId, oldToken]
    );
  }

  private static async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await database.query(
      'DELETE FROM user_sessions WHERE user_id = $1 AND refresh_token = $2',
      [userId, refreshToken]
    );
  }

  private static async invalidateAllRefreshTokens(userId: string): Promise<void> {
    await database.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );
  }

  // Clean up expired refresh tokens
  static async cleanupExpiredTokens(): Promise<void> {
    await database.query(
      'DELETE FROM user_sessions WHERE expires_at < NOW()'
    );
  }
}