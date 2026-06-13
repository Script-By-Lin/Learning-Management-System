import { supabase } from '../core/config/supabase';
import crypto from 'crypto';

export interface UserActivityLog {
  id: string;
  userId: string;
  activityType: string;
  details: string | null;
  createdAt: string;
}

export class UserActivityRepository {
  /**
   * Log an activity to the database. Catch and log errors instead of crashing the system.
   */
  async logActivity(userId: string, activityType: string, details?: string | null): Promise<UserActivityLog | null> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const insertData = {
        id,
        userId,
        activityType,
        details: details ?? null,
        createdAt: now,
      };

      const { data, error } = await supabase
        .from('UserActivityLog')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Table probably doesn't exist yet, or other Postgres error
        console.warn(`[UserActivityRepository.logActivity] Failed to insert log (Table may be missing): ${error.message}`);
        return null;
      }

      return data;
    } catch (err: any) {
      console.warn(`[UserActivityRepository.logActivity] Exception occurred: ${err.message}`);
      return null;
    }
  }

  /**
   * Fetch all activity logs (limited)
   */
  async getLogs(limit: number = 100): Promise<UserActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('UserActivityLog')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (err: any) {
      console.warn(`[UserActivityRepository.getLogs] Could not fetch logs (using empty list): ${err.message}`);
      return [];
    }
  }

  /**
   * Get logs grouped by date for calculating Daily Active Users
   */
  async getDAU(daysLimit: number = 7): Promise<{ date: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('UserActivityLog')
        .select('userId, createdAt')
        .order('createdAt', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      // Group and count unique users per day in Javascript since Supabase JS doesn't support complex group-by on custom time truncs
      const dayMap: { [date: string]: Set<string> } = {};
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - daysLimit);

      const logs = data || [];
      for (const log of logs) {
        const logDate = new Date(log.createdAt);
        if (logDate >= limitDate) {
          const dateStr = logDate.toISOString().split('T')[0];
          if (!dayMap[dateStr]) {
            dayMap[dateStr] = new Set<string>();
          }
          dayMap[dateStr].add(log.userId);
        }
      }

      // Convert to ordered array
      const result = Object.keys(dayMap).map((date) => ({
        date,
        count: dayMap[date].size,
      }));

      // Sort chronologically
      return result.sort((a, b) => a.date.localeCompare(b.date));
    } catch (err: any) {
      console.warn(`[UserActivityRepository.getDAU] Failed, returning empty: ${err.message}`);
      return [];
    }
  }
}

export const userActivityRepository = new UserActivityRepository();
export default userActivityRepository;
