import { webSettingsService } from '../../services/business/WebSettingsService';
import { Role } from '../../shared/constants/roles';

export class WebSettingsController {
  /**
   * Get active web settings (Public access)
   */
  async getSettings() {
    try {
      const settings = await webSettingsService.getSettings();
      return { success: true, data: settings, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to retrieve web settings.' };
    }
  }

  /**
   * Update active web settings (Admin only access)
   */
  async updateSettings(body: any, role: Role) {
    try {
      if (role !== Role.ADMIN) {
        return { success: false, data: null, error: 'Access denied: Only administrators can update web settings.' };
      }

      // Extract and sanitize settings inputs
      const { lmsName, bannerTitle, bannerSubtitle, bannerUrl, footerInfo, contactEmail } = body;
      
      const updateData: any = {};
      if (lmsName !== undefined) updateData.lmsName = String(lmsName).trim();
      if (bannerTitle !== undefined) updateData.bannerTitle = String(bannerTitle).trim();
      if (bannerSubtitle !== undefined) updateData.bannerSubtitle = String(bannerSubtitle).trim();
      if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl ? String(bannerUrl).trim() : null;
      if (footerInfo !== undefined) updateData.footerInfo = String(footerInfo).trim();
      if (contactEmail !== undefined) updateData.contactEmail = String(contactEmail).trim();

      const settings = await webSettingsService.updateSettings(updateData);
      return { success: true, data: settings, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update web settings.' };
    }
  }
}

export const webSettingsController = new WebSettingsController();
export default webSettingsController;
