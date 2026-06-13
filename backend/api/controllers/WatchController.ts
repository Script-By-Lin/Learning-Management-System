import { watchService } from '../../services/business/WatchService';

export class WatchController {
  /**
   * Update watch progress for a lesson
   */
  async updateProgress(userId: string, body: any) {
    try {
      const { lessonId, courseId, watchedSeconds, totalSeconds, lastPosition } = body;

      if (!lessonId || !courseId) {
        return { success: false, data: null, error: 'lessonId and courseId are required.' };
      }

      const session = await watchService.updateWatchProgress(
        userId,
        lessonId,
        courseId,
        watchedSeconds || 0,
        totalSeconds || 0,
        lastPosition || 0
      );

      return { success: true, data: session, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update watch progress.' };
    }
  }

  /**
   * Get student's watch analytics
   */
  async getAnalytics(userId: string) {
    try {
      const analytics = await watchService.getStudentAnalytics(userId);
      return { success: true, data: analytics, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch watch analytics.' };
    }
  }

  /**
   * Get watch stats for a specific course
   */
  async getCourseWatchStats(userId: string, courseId: string) {
    try {
      if (!courseId) {
        return { success: false, data: null, error: 'courseId is required.' };
      }

      const stats = await watchService.getCourseWatchStats(userId, courseId);
      return { success: true, data: stats, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch course watch stats.' };
    }
  }

  /**
   * Get instructor analytics
   */
  async getInstructorAnalytics(instructorId: string) {
    try {
      const analytics = await watchService.getInstructorAnalytics(instructorId);
      return { success: true, data: analytics, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch instructor analytics.' };
    }
  }
}

export const watchController = new WatchController();
export default watchController;
