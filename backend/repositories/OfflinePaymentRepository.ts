import { supabase } from '../core/config/supabase';

export interface OfflinePayment {
  id: string;
  userId: string;
  courseId: string;
  amount: string;
  receiptUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  transactionDate?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    fullName: string;
    email: string;
  };
  course?: {
    title: string;
  };
}

export interface CreateOfflinePaymentInput {
  userId: string;
  courseId: string;
  amount: string;
  receiptUrl: string;
}

export class OfflinePaymentRepository {
  /**
   * Find a specific payment request by ID
   */
  async findById(id: string): Promise<OfflinePayment | null> {
    const { data, error } = await supabase
      .from('OfflinePayment')
      .select('*, user:User(fullName, email), course:Course(title)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Check if a student has a payment record for a course
   */
  async findByUserAndCourse(userId: string, courseId: string): Promise<OfflinePayment | null> {
    const { data, error } = await supabase
      .from('OfflinePayment')
      .select('*')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Find payments submitted by a specific student
   */
  async findByUserId(userId: string): Promise<OfflinePayment[]> {
    const { data, error } = await supabase
      .from('OfflinePayment')
      .select('*, course:Course(title)')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Find all payments
   */
  async findAll(): Promise<OfflinePayment[]> {
    const { data, error } = await supabase
      .from('OfflinePayment')
      .select('*, user:User(fullName, email), course:Course(title)')
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Create an offline payment request
   */
  async create(data: CreateOfflinePaymentInput): Promise<OfflinePayment> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      userId: data.userId,
      courseId: data.courseId,
      amount: data.amount,
      receiptUrl: data.receiptUrl,
      status: 'PENDING',
      transactionDate: now,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('OfflinePayment')
      .insert(insertData)
      .select('*, user:User(fullName, email), course:Course(title)')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return created;
  }

  /**
   * Update payment status (APPROVED / REJECTED)
   */
  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<OfflinePayment> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('OfflinePayment')
      .update({ status, updatedAt: now })
      .eq('id', id)
      .select('*, user:User(fullName, email), course:Course(title)')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return updated;
  }

  /**
   * Update payment receipt details and reset status to PENDING
   */
  async updateReceipt(id: string, amount: string, receiptUrl: string): Promise<OfflinePayment> {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('OfflinePayment')
      .update({ amount, receiptUrl, status: 'PENDING', updatedAt: now })
      .eq('id', id)
      .select('*, user:User(fullName, email), course:Course(title)')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return updated;
  }
}

export const offlinePaymentRepository = new OfflinePaymentRepository();
export default offlinePaymentRepository;
