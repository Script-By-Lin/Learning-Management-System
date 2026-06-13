import { supabase } from '../core/config/supabase';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  instructorId: string;
  categoryId: string | null;
  price: number;
  expiry: string | null;
  level: string;
  status: string;
  faq: string | null;
  requirements: string | null;
  outcomes: string | null;
  approvalStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  category: string;
  thumbnailUrl?: string | null;
  instructorId: string;
  categoryId?: string | null;
  level?: string;
  status?: string;
  faq?: string | null;
  requirements?: string | null;
  outcomes?: string | null;
  price?: number;
  expiry?: string | null;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string | null;
  categoryId?: string | null;
  price?: number;
  expiry?: string | null;
  level?: string;
  status?: string;
  faq?: string | null;
  requirements?: string | null;
  outcomes?: string | null;
  approvalStatus?: string;
}

export class CourseRepository {
  /**
   * Find all courses ordered by creation date
   */
  async findAll(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('Course')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find a course by ID
   */
  async findById(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from('Course')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find courses taught by a specific instructor
   */
  async findByInstructorId(instructorId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('Course')
      .select('*')
      .eq('instructorId', instructorId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new course
   */
  async create(data: CreateCourseInput): Promise<Course> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      title: data.title,
      description: data.description,
      category: data.category,
      thumbnailUrl: data.thumbnailUrl ?? null,
      instructorId: data.instructorId,
      categoryId: data.categoryId ?? null,
      price: data.price ?? 0,
      expiry: data.expiry ?? null,
      level: data.level ?? 'Beginner',
      status: data.status ?? 'ACTIVE',
      faq: data.faq ?? null,
      requirements: data.requirements ?? null,
      outcomes: data.outcomes ?? null,
      approvalStatus: 'PENDING', // Pending admin approval initially
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdCourse, error } = await supabase
      .from('Course')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdCourse;
  }

  /**
   * Update an existing course
   */
  async update(id: string, data: UpdateCourseInput): Promise<Course> {
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    const { data: updatedCourse, error } = await supabase
      .from('Course')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedCourse;
  }

  /**
   * Delete a course by ID
   */
  async delete(id: string): Promise<Course> {
    const { data: deletedCourse, error } = await supabase
      .from('Course')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return deletedCourse;
  }
}

export const courseRepository = new CourseRepository();
export default courseRepository;
