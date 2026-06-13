import { supabase } from '../../core/config/supabase';
import { progressRepository, LessonProgress } from '../../repositories/ProgressRepository';
import { certificateRepository, Certificate } from '../../repositories/CertificateRepository';
import { moduleRepository } from '../../repositories/ModuleRepository';
import { lessonRepository } from '../../repositories/LessonRepository';

export class ProgressService {
  /**
   * Fetch a single lesson's completion state
   */
  async getLessonCompletion(userId: string, lessonId: string): Promise<boolean> {
    const progress = await progressRepository.findByUserIdAndLessonId(userId, lessonId);
    return progress ? progress.completed : false;
  }

  /**
   * Get overall course completion statistics
   */
  async getCourseProgress(userId: string, courseId: string): Promise<{ completedCount: number; totalCount: number; percentage: number; completedLessonIds: string[] }> {
    // 1. Get modules
    const modules = await moduleRepository.findByCourseId(courseId);
    if (modules.length === 0) {
      return { completedCount: 0, totalCount: 0, percentage: 0, completedLessonIds: [] };
    }

    // 2. Get lessons for these modules
    const moduleIds = modules.map((m) => m.id);
    const { data: lessons, error: lesErr } = await supabase
      .from('Lesson')
      .select('id')
      .in('moduleId', moduleIds);

    if (lesErr) {
      throw new Error(`Database error: ${lesErr.message}`);
    }

    const totalCount = lessons ? lessons.length : 0;
    if (totalCount === 0) {
      return { completedCount: 0, totalCount: 0, percentage: 0, completedLessonIds: [] };
    }

    // 3. Get completed lesson count
    const completedLessonIds = await progressRepository.findCompletedLessonsForCourse(userId, courseId);
    const completedCount = completedLessonIds.length;
    const percentage = Math.min(100, Math.max(0, Math.round((completedCount / totalCount) * 100)));

    return { completedCount, totalCount, percentage, completedLessonIds };
  }

  /**
   * Toggle lesson completion progress
   */
  async toggleLessonProgress(userId: string, lessonId: string, completed: boolean): Promise<LessonProgress> {
    const progress = await progressRepository.setLessonCompleted(userId, lessonId, completed);

    // Auto-issue certificate if progress becomes 100% complete
    const lesson = await lessonRepository.findById(lessonId);
    if (lesson) {
      const mod = await moduleRepository.findById(lesson.moduleId);
      if (mod) {
        const stats = await this.getCourseProgress(userId, mod.courseId);
        if (stats.percentage === 100) {
          try {
            await certificateRepository.create(userId, mod.courseId);
            console.log(`🏆 Auto-issued Certificate to user ${userId} for course ${mod.courseId}`);
          } catch (certError) {
            console.error('Failed to auto-issue certificate:', certError);
          }
        }
      }
    }

    return progress;
  }

  /**
   * Fetch or check certificate issuance for a user in a course
   */
  async getCertificate(userId: string, courseId: string): Promise<Certificate | null> {
    const stats = await this.getCourseProgress(userId, courseId);
    if (stats.percentage < 100) {
      return null;
    }
    // Ensure issued
    return certificateRepository.create(userId, courseId);
  }

  /**
   * Get all certificates issued for a user
   */
  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return certificateRepository.findByUserId(userId);
  }
}

export const progressService = new ProgressService();
export default progressService;
