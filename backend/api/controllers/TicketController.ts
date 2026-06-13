import { ticketService } from '../../services/business/TicketService';
import { Role } from '../../shared/constants/roles';

export class TicketController {
  /**
   * List all support tickets (Admin only)
   */
  async listTickets(role: Role) {
    try {
      if (role !== Role.ADMIN) {
        return { success: false, data: null, error: 'Access denied: Only administrators can list tickets.' };
      }
      const tickets = await ticketService.getAllTickets();
      return { success: true, data: tickets, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list tickets.' };
    }
  }

  /**
   * Submit a new support ticket (Public)
   */
  async createTicket(body: any) {
    try {
      const { name, email, subject, message } = body;
      if (!name || !name.trim()) {
        return { success: false, data: null, error: 'Name is required.' };
      }
      if (!email || !email.trim()) {
        return { success: false, data: null, error: 'Email is required.' };
      }
      if (!subject || !subject.trim()) {
        return { success: false, data: null, error: 'Subject is required.' };
      }
      if (!message || !message.trim()) {
        return { success: false, data: null, error: 'Message is required.' };
      }

      const ticket = await ticketService.createTicket({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      return { success: true, data: ticket, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create ticket.' };
    }
  }

  /**
   * Resolve/Unresolve a support ticket (Admin only)
   */
  async resolveTicket(id: string, resolved: boolean, role: Role) {
    try {
      if (role !== Role.ADMIN) {
        return { success: false, data: null, error: 'Access denied: Only administrators can resolve tickets.' };
      }
      if (!id) {
        return { success: false, data: null, error: 'Ticket ID is required.' };
      }

      const ticket = await ticketService.resolveTicket(id, resolved);
      return { success: true, data: ticket, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to resolve ticket.' };
    }
  }
}

export const ticketController = new TicketController();
export default ticketController;
