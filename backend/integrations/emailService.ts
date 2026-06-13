import { config } from '../core/config/config';

async function fetchWithRetry(url: string, options: any, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`HTTP Client Error: ${res.statusText}`);
      }
    } catch (e: any) {
      if (i === retries - 1) throw e;
      // Exponential backoff
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error('Failed to fetch after multiple retries.');
}

export class EmailService {
  private apiKey = config.email.apiKey;

  private async sendEmail(to: string, subject: string, htmlContent: string) {
    console.log(`✉️ [Email Service] Sending to: ${to} | Subject: ${subject}`);

    // If key is a placeholder or not provided, mock deliver it in the console logs
    if (!this.apiKey || this.apiKey.includes('placeholder')) {
      console.log(`✉️ [Email Mock Deliver] key is placeholder. HTML content details:`);
      console.log(`----------------------------------------`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${htmlContent}`);
      console.log(`----------------------------------------`);
      return { success: true, mock: true };
    }

    const payload = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'noreply@nexoraacademy.com', name: 'Nexora Academy' },
      subject: subject,
      content: [{ type: 'text/html', value: htmlContent }],
    };

    try {
      await fetchWithRetry('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return { success: true };
    } catch (err: any) {
      console.error(`❌ [Email Service] Failed sending email via SendGrid: ${err.message}`);
      throw err;
    }
  }

  async sendEnrollmentEmail(to: string, studentName: string, courseTitle: string) {
    return this.sendEmail(
      to,
      `Welcome to ${courseTitle}!`,
      `<h3>Hello, ${studentName}!</h3>
       <p>You have successfully enrolled in <strong>${courseTitle}</strong>.</p>
       <p>Resume your studies in your learning workspace dashboard.</p>`
    );
  }

  async sendDeadlineEmail(to: string, studentName: string, assignmentTitle: string, dueDate: string) {
    return this.sendEmail(
      to,
      `Deadline Reminder: ${assignmentTitle}`,
      `<h3>Hello, ${studentName}!</h3>
       <p>This is a reminder that the assignment <strong>${assignmentTitle}</strong> is due on <strong>${dueDate}</strong>.</p>
       <p>Please submit your work before the deadline to receive grades.</p>`
    );
  }

  async sendResultEmail(to: string, studentName: string, quizTitle: string, score: number, passed: boolean) {
    return this.sendEmail(
      to,
      `Quiz Results: ${quizTitle}`,
      `<h3>Hello, ${studentName}!</h3>
       <p>You have finished the quiz <strong>${quizTitle}</strong>.</p>
       <p>Score: <strong>${score}%</strong> (${passed ? 'PASSED 🎉' : 'FAILED ❌'})</p>`
    );
  }

  async sendNewsletterEmail(to: string, studentName: string, subject: string, message: string) {
    return this.sendEmail(
      to,
      subject,
      `<h3>Hello, ${studentName}!</h3>
       <p>${message.replace(/\n/g, '<br/>')}</p>`
    );
  }
}

export const emailService = new EmailService();
export default emailService;
