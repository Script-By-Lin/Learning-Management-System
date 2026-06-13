import { progressService } from '../../services/business/ProgressService';

export class ProgressController {
  async getLessonCompletion(userId: string, lessonId: string) {
    try {
      if (!lessonId) {
        return { success: false, data: null, error: 'Lesson ID is required.' };
      }
      const completed = await progressService.getLessonCompletion(userId, lessonId);
      return { success: true, data: { completed }, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch progress.' };
    }
  }

  async toggleLessonProgress(userId: string, lessonId: string, body: any) {
    try {
      const { completed } = body;
      if (!lessonId) {
        return { success: false, data: null, error: 'Lesson ID is required.' };
      }
      if (completed === undefined) {
        return { success: false, data: null, error: 'Completed state is required.' };
      }
      const progress = await progressService.toggleLessonProgress(userId, lessonId, completed);
      return { success: true, data: progress, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update progress.' };
    }
  }

  async getCourseProgress(userId: string, courseId: string) {
    try {
      if (!courseId) {
        return { success: false, data: null, error: 'Course ID is required.' };
      }
      const progress = await progressService.getCourseProgress(userId, courseId);
      return { success: true, data: progress, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch course progress.' };
    }
  }

  async getCertificate(userId: string, courseId: string) {
    try {
      if (!courseId) {
        return { success: false, data: null, error: 'Course ID is required.' };
      }
      const certificate = await progressService.getCertificate(userId, courseId);
      if (!certificate) {
        return { success: false, data: null, error: 'Course is not completed yet.' };
      }
      return { success: true, data: certificate, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to retrieve certificate.' };
    }
  }

  async listUserCertificates(userId: string) {
    try {
      const list = await progressService.getUserCertificates(userId);
      return { success: true, data: list, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list certificates.' };
    }
  }
}

export const progressController = new ProgressController();
export default progressController;
