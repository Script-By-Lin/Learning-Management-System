import { supabase } from '../core/config/supabase';
import { LessonType } from '../shared/constants/roles';

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  type: LessonType;
  order: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonInput {
  moduleId: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  type?: LessonType;
  order: number;
  duration?: number;
}

export interface UpdateLessonInput {
  title?: string;
  content?: string | null;
  videoUrl?: string | null;
  type?: LessonType;
  order?: number;
  duration?: number;
}

export class LessonRepository {
  /**
   * Find lessons belonging to a specific Module, ordered by sequence order
   */
  async findByModuleId(moduleId: string): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('Lesson')
      .select('*')
      .eq('moduleId', moduleId)
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find a lesson by ID
   */
  async findById(id: string): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from('Lesson')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new lesson
   */
  async create(data: CreateLessonInput): Promise<Lesson> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      moduleId: data.moduleId,
      title: data.title,
      content: data.content ?? null,
      videoUrl: data.videoUrl ?? null,
      type: data.type ?? LessonType.VIDEO,
      order: data.order,
      duration: data.duration ?? 0,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdLesson, error } = await supabase
      .from('Lesson')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdLesson;
  }

  /**
   * Update a lesson
   */
  async update(id: string, data: UpdateLessonInput): Promise<Lesson> {
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    const { data: updatedLesson, error } = await supabase
      .from('Lesson')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedLesson;
  }

  /**
   * Delete a lesson by ID
   */
  async delete(id: string): Promise<Lesson> {
    const { data: deletedLesson, error } = await supabase
      .from('Lesson')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return deletedLesson;
  }
}

export const lessonRepository = new LessonRepository();
export default lessonRepository;
