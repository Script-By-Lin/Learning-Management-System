import { supabase } from '../core/config/supabase';

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateCode: string;
  issuedAt: string;
  course?: {
    id: string;
    title: string;
    description: string;
    category: string;
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export class CertificateRepository {
  /**
   * Find certificate by user and course
   */
  async findByUserAndCourse(userId: string, courseId: string): Promise<Certificate | null> {
    const { data, error } = await supabase
      .from('Certificate')
      .select('*, course:Course(id, title, description, category)')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find all certificates for a user
   */
  async findByUserId(userId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('Certificate')
      .select('*, course:Course(id, title, description, category)')
      .eq('userId', userId)
      .order('issuedAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Issue a new certificate
   */
  async create(userId: string, courseId: string): Promise<Certificate> {
    const existing = await this.findByUserAndCourse(userId, courseId);
    if (existing) return existing;

    const id = crypto.randomUUID();
    const certificateCode = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const insertData = {
      id,
      userId,
      courseId,
      certificateCode,
      issuedAt: now,
    };

    const { data: createdCert, error } = await supabase
      .from('Certificate')
      .insert(insertData)
      .select('*, course:Course(id, title, description, category)')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdCert;
  }
}

export const certificateRepository = new CertificateRepository();
export default certificateRepository;
