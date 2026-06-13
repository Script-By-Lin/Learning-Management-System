import { userRepository } from '../../repositories/UserRepository';
import { emailService } from '../../integrations/emailService';
import { Role } from '../../shared/constants/roles';

export class NewsletterService {
  /**
   * Broadcasts a newsletter to all registered students
   */
  async broadcastNewsletter(subject: string, message: string): Promise<{ sentCount: number }> {
    if (!subject || !message) {
      throw new Error('Subject and message are required.');
    }

    const users = await userRepository.findAll();
    const students = users.filter((user) => user.role === Role.STUDENT);

    let sentCount = 0;
    for (const student of students) {
      try {
        await emailService.sendNewsletterEmail(student.email, student.fullName, subject, message);
        sentCount++;
      } catch (err: any) {
        console.error(`❌ [NewsletterService] Failed to send newsletter to ${student.email}: ${err.message}`);
      }
    }

    return { sentCount };
  }
}

export const newsletterService = new NewsletterService();
export default newsletterService;
