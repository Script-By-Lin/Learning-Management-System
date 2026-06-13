import { supabase } from '../core/config/supabase';

export interface WebSettings {
  id: string;
  lmsName: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerUrl: string | null;
  footerInfo: string;
  contactEmail: string;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  lmsName?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerUrl?: string | null;
  footerInfo?: string;
  contactEmail?: string;
}

export class WebSettingsRepository {
  /**
   * Get active web settings, or return default values if database retrieval fails or is empty
   */
  async getSettings(): Promise<WebSettings> {
    const { data, error } = await supabase
      .from('WebSettings')
      .select('*')
      .eq('id', 'current')
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      // Return default values in case database is not migrated yet
      return {
        id: 'current',
        lmsName: 'Nexora Academy',
        bannerTitle: 'Unlock Your Potential with Nexora Academy',
        bannerSubtitle: 'Access world-class learning and professional certifications, anytime, anywhere.',
        bannerUrl: null,
        footerInfo: '© 2026 Nexora Academy. All rights reserved.',
        contactEmail: 'support@nexoraacademy.com',
        updatedAt: new Date().toISOString(),
      };
    }

    return data;
  }

  /**
   * Update or insert settings under the 'current' settings row ID
   */
  async updateSettings(data: UpdateSettingsInput): Promise<WebSettings> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('WebSettings')
      .upsert({
        id: 'current',
        ...data,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updated;
  }
}

export const webSettingsRepository = new WebSettingsRepository();
export default webSettingsRepository;
