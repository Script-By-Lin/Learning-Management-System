import { webSettingsRepository, WebSettings, UpdateSettingsInput } from '../../repositories/WebSettingsRepository';

export class WebSettingsService {
  /**
   * Fetch site configuration settings
   */
  async getSettings(): Promise<WebSettings> {
    return webSettingsRepository.getSettings();
  }

  /**
   * Update site configuration settings
   */
  async updateSettings(data: UpdateSettingsInput): Promise<WebSettings> {
    return webSettingsRepository.updateSettings(data);
  }
}

export const webSettingsService = new WebSettingsService();
export default webSettingsService;
