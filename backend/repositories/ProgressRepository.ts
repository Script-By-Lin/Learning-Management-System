import { supabase } from '../core/config/supabase';

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProgressRepository {
  /**
   * Find a single lesson progress entry
   */
  async findByUserIdAndLessonId(userId: string, lessonId: string): Promise<LessonProgress | null> {
    const { data, error } = await supabase
      .from('LessonProgress')
      .select('*')
      .eq('userId', userId)
      .eq('lessonId', lessonId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all completed lesson IDs for a student in a specific course
   */
  async findCompletedLessonsForCourse(userId: string, courseId: string): Promise<string[]> {
    // 1. Get all lesson IDs in the course
    const { data: modules, error: modErr } = await supabase
      .from('Module')
      .select('id')
      .eq('courseId', courseId);

    if (modErr) throw new Error(`Database error: ${modErr.message}`);
    if (!modules || modules.length === 0) return [];

    const moduleIds = modules.map((m) => m.id);

    const { data: lessons, error: lesErr } = await supabase
      .from('Lesson')
      .select('id')
      .in('moduleId', moduleIds);

    if (lesErr) throw new Error(`Database error: ${lesErr.message}`);
    if (!lessons || lessons.length === 0) return [];

    const lessonIds = lessons.map((l) => l.id);

    // 2. Find completed entries
    const { data: progress, error: progErr } = await supabase
      .from('LessonProgress')
      .select('lessonId')
      .eq('userId', userId)
      .eq('completed', true)
      .in('lessonId', lessonIds);

    if (progErr) throw new Error(`Database error: ${progErr.message}`);

    return progress ? progress.map((p) => p.lessonId) : [];
  }

  /**
   * Mark a lesson as completed or incomplete
   */
  async setLessonCompleted(userId: string, lessonId: string, completed: boolean): Promise<LessonProgress> {
    const existing = await this.findByUserIdAndLessonId(userId, lessonId);
    const now = new Date().toISOString();

    if (existing) {
      const { data: updated, error } = await supabase
        .from('LessonProgress')
        .update({ completed, updatedAt: now })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(`Database error: ${error.message}`);
      return updated;
    } else {
      const id = crypto.randomUUID();
      const { data: inserted, error } = await supabase
        .from('LessonProgress')
        .insert({
          id,
          userId,
          lessonId,
          completed,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (error) throw new Error(`Database error: ${error.message}`);
      return inserted;
    }
  }
}

export const progressRepository = new ProgressRepository();
export default progressRepository;
