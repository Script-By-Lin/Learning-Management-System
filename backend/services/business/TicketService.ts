import { ticketRepository, Ticket, CreateTicketInput } from '../../repositories/TicketRepository';

export class TicketService {
  async getAllTickets(): Promise<Ticket[]> {
    return ticketRepository.findAll();
  }

  async createTicket(data: CreateTicketInput): Promise<Ticket> {
    if (!data.name || !data.email || !data.subject || !data.message) {
      throw new Error('Name, email, subject, and message are required.');
    }
    return ticketRepository.create(data);
  }

  async resolveTicket(id: string, resolved: boolean): Promise<Ticket> {
    const existing = await ticketRepository.findById(id);
    if (!existing) {
      throw new Error('Ticket not found.');
    }
    return ticketRepository.updateStatus(id, resolved);
  }
}

export const ticketService = new TicketService();
export default ticketService;
