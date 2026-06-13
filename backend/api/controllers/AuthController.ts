import { authService } from '../../services/business/AuthService';
import { Role } from '../../shared/constants/roles';
import { Logger } from '../../core/utils/logger';

export class AuthController {
  /**
   * Handle user registration
   */
  async register(body: any) {
    try {
      const { email, password, fullName, role } = body;
      Logger.info(`AuthController.register called for: ${email}`, { fullName, role });

      if (!email || !password || !fullName) {
        return {
          success: false,
          data: null,
          error: 'Email, password, and full name are required.',
        };
      }

      // Public registrations (sign up / re-sign up) are strictly limited to STUDENT accounts
      const parsedRole: Role = Role.STUDENT;

      const result = await authService.register({
        email,
        password,
        fullName,
        role: parsedRole,
      });

      Logger.info(`AuthController.register success for user: ${result.user.id}`);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error: any) {
      Logger.error(`AuthController.register failed for: ${body?.email}`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'An error occurred during registration.',
      };
    }
  }

  /**
   * Handle user login
   */
  async login(body: any) {
    try {
      const { email, password } = body;
      Logger.info(`AuthController.login called for: ${email}`);

      if (!email || !password) {
        return {
          success: false,
          data: null,
          error: 'Email and password are required.',
        };
      }

      const result = await authService.login({ email, password });

      Logger.info(`AuthController.login success for user: ${result.user.id}`);
      return {
        success: true,
        data: result,
        error: null,
      };
    } catch (error: any) {
      Logger.error(`AuthController.login failed for: ${body?.email}`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'An error occurred during login.',
      };
    }
  }

  /**
   * Fetch logged-in user profile details
   */
  async me(userId: string) {
    try {
      Logger.info(`AuthController.me called for userId: ${userId}`);
      if (!userId) {
        return {
          success: false,
          data: null,
          error: 'Unauthorized access.',
        };
      }

      const profile = await authService.getProfile(userId);

      return {
        success: true,
        data: { user: profile },
        error: null,
      };
    } catch (error: any) {
      Logger.error(`AuthController.me failed for userId: ${userId}`, error);
      return {
        success: false,
        data: null,
        error: error.message || 'An error occurred while fetching profile.',
      };
    }
  }
}

export const authController = new AuthController();
export default authController;
