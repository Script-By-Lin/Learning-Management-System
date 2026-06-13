import { newsletterService } from '../../services/business/NewsletterService';
import { Role } from '../../shared/constants/roles';

export class NewsletterController {
  /**
   * Broadcast a newsletter to all students (Admin only)
   */
  async broadcastNewsletter(body: any, role: Role) {
    try {
      if (role !== Role.ADMIN) {
        return { success: false, data: null, error: 'Access denied: Only administrators can broadcast newsletters.' };
      }

      const { subject, message } = body;
      if (!subject || !subject.trim()) {
        return { success: false, data: null, error: 'Subject is required.' };
      }
      if (!message || !message.trim()) {
        return { success: false, data: null, error: 'Message is required.' };
      }

      const result = await newsletterService.broadcastNewsletter(subject.trim(), message.trim());
      return { success: true, data: result, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to broadcast newsletter.' };
    }
  }
}

export const newsletterController = new NewsletterController();
export default newsletterController;
