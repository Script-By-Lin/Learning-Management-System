import { supabase } from '../core/config/supabase';
import crypto from 'crypto';

export interface WatchSession {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  watchedSeconds: number;
  totalSeconds: number;
  lastPosition: number;
  createdAt: string;
  updatedAt: string;
}

export class WatchRepository {
  /**
   * Upsert a watch session — update if exists, insert if not
   */
  async upsertWatchSession(
    userId: string,
    lessonId: string,
    courseId: string,
    watchedSeconds: number,
    totalSeconds: number,
    lastPosition: number
  ): Promise<WatchSession> {
    const now = new Date().toISOString();

    // Check if session exists
    const { data: existing } = await supabase
      .from('WatchSession')
      .select('*')
      .eq('userId', userId)
      .eq('lessonId', lessonId)
      .maybeSingle();

    if (existing) {
      // Only update if new watched time is greater
      const newWatched = Math.max(existing.watchedSeconds, watchedSeconds);
      const newTotal = totalSeconds > 0 ? totalSeconds : existing.totalSeconds;

      const { data: updated, error } = await supabase
        .from('WatchSession')
        .update({
          watchedSeconds: newWatched,
          totalSeconds: newTotal,
          lastPosition,
          updatedAt: now,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(`Database error: ${error.message}`);
      return updated;
    } else {
      const id = crypto.randomUUID();
      const { data: inserted, error } = await supabase
        .from('WatchSession')
        .insert({
          id,
          userId,
          lessonId,
          courseId,
          watchedSeconds,
          totalSeconds,
          lastPosition,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (error) throw new Error(`Database error: ${error.message}`);
      return inserted;
    }
  }

  /**
   * Get all watch sessions for a user (ordered by most recent)
   */
  async findByUserId(userId: string): Promise<WatchSession[]> {
    const { data, error } = await supabase
      .from('WatchSession')
      .select('*')
      .eq('userId', userId)
      .order('updatedAt', { ascending: false });

    if (error) throw new Error(`Database error: ${error.message}`);
    return data || [];
  }

  /**
   * Get watch sessions for a specific course by a user
   */
  async findByUserAndCourse(userId: string, courseId: string): Promise<WatchSession[]> {
    const { data, error } = await supabase
      .from('WatchSession')
      .select('*')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .order('updatedAt', { ascending: false });

    if (error) throw new Error(`Database error: ${error.message}`);
    return data || [];
  }

  /**
   * Get all watch sessions for a specific course (instructor analytics)
   */
  async findByCourseId(courseId: string): Promise<WatchSession[]> {
    const { data, error } = await supabase
      .from('WatchSession')
      .select('*')
      .eq('courseId', courseId)
      .order('updatedAt', { ascending: false });

    if (error) throw new Error(`Database error: ${error.message}`);
    return data || [];
  }

  /**
   * Get watch sessions for multiple courses (instructor aggregate)
   */
  async findByCourseIds(courseIds: string[]): Promise<WatchSession[]> {
    if (courseIds.length === 0) return [];

    const { data, error } = await supabase
      .from('WatchSession')
      .select('*')
      .in('courseId', courseIds)
      .order('updatedAt', { ascending: false });

    if (error) throw new Error(`Database error: ${error.message}`);
    return data || [];
  }

  /**
   * Get total watch time aggregate for a user
   */
  async getTotalWatchTime(userId: string): Promise<number> {
    const sessions = await this.findByUserId(userId);
    return sessions.reduce((sum, s) => sum + s.watchedSeconds, 0);
  }

  /**
   * Get recent watch sessions with lesson and course info (last N)
   */
  async getRecentSessions(userId: string, limit: number = 10): Promise<WatchSession[]> {
    const { data, error } = await supabase
      .from('WatchSession')
      .select('*')
      .eq('userId', userId)
      .order('updatedAt', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Database error: ${error.message}`);
    return data || [];
  }

  /**
   * Get unique active days for calculating streak
   */
  async getActiveDays(userId: string): Promise<string[]> {
    const sessions = await this.findByUserId(userId);
    const uniqueDays = new Set<string>();

    sessions.forEach((s) => {
      const day = new Date(s.updatedAt).toISOString().split('T')[0];
      uniqueDays.add(day);
    });

    return Array.from(uniqueDays).sort().reverse();
  }
}

export const watchRepository = new WatchRepository();
export default watchRepository;
