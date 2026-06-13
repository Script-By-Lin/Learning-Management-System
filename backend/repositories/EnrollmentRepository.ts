import { supabase } from '../core/config/supabase';

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  joinedAt: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string | null;
    instructorId: string;
  };
}

export class EnrollmentRepository {
  /**
   * Find enrollment by user ID and course ID
   */
  async findByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    const { data, error } = await supabase
      .from('Enrollment')
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
   * Find all enrollments for a user, optionally including course details
   */
  async findByUserId(userId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from('Enrollment')
      .select('*, course:Course(*)')
      .eq('userId', userId)
      .order('joinedAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find all enrollments for a course
   */
  async findByCourseId(courseId: string): Promise<Enrollment[]> {
    const { data, error } = await supabase
      .from('Enrollment')
      .select('*')
      .eq('courseId', courseId)
      .order('joinedAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create enrollment
   */
  async create(userId: string, courseId: string): Promise<Enrollment> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      userId,
      courseId,
      joinedAt: now,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdEnrollment, error } = await supabase
      .from('Enrollment')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdEnrollment;
  }

  /**
   * Update enrollment completion status
   */
  async updateCompletion(id: string, completed: boolean): Promise<Enrollment> {
    const now = new Date().toISOString();

    const { data: updatedEnrollment, error } = await supabase
      .from('Enrollment')
      .update({ completed, updatedAt: now })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedEnrollment;
  }
}

export const enrollmentRepository = new EnrollmentRepository();
export default enrollmentRepository;
