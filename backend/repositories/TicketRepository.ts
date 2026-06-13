import { supabase } from '../core/config/supabase';

export interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export class TicketRepository {
  /**
   * Find all tickets ordered by creation date (newest first)
   */
  async findAll(): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('Ticket')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find a ticket by ID
   */
  async findById(id: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from('Ticket')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new ticket
   */
  async create(data: CreateTicketInput): Promise<Ticket> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdTicket, error } = await supabase
      .from('Ticket')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdTicket;
  }

  /**
   * Update resolution status of a ticket
   */
  async updateStatus(id: string, resolved: boolean): Promise<Ticket> {
    const now = new Date().toISOString();

    const { data: updatedTicket, error } = await supabase
      .from('Ticket')
      .update({ resolved, updatedAt: now })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedTicket;
  }
}

export const ticketRepository = new TicketRepository();
export default ticketRepository;
