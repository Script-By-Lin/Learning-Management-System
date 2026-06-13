/**
 * Client-side service for Authentication API requests
 */

export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(data: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to connect to registration server.',
      };
    }
  },

  /**
   * Log in an existing user
   */
  async login(data: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to connect to authentication server.',
      };
    }
  },

  /**
   * Log out the current user (clears cookies)
   */
  async logout(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to complete logout request.',
      };
    }
  },

  /**
   * Fetch current logged in user details using cookies
   */
  async getProfile(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch user profile.',
      };
    }
  },

  async updateProfile(data: { fullName: string; bio: string | null; avatarUrl: string | null }): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update user profile.',
      };
    }
  },

  async uploadAvatar(avatarFile: File): Promise<APIResponse<{ avatarUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('avatarFile', avatarFile);
      const response = await fetch('/api/users/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to upload profile avatar.',
      };
    }
  },

  async getSettings(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/settings');
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch settings.',
      };
    }
  },

  async updateSettings(data: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to update settings.',
      };
    }
  },

  async uploadBanner(bannerFile: File): Promise<APIResponse<{ bannerUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('bannerFile', bannerFile);
      const response = await fetch('/api/settings/upload-banner', {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to upload banner.',
      };
    }
  },
};

export default authService;
