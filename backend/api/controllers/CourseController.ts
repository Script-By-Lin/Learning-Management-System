import { courseService } from '../../services/business/CourseService';
import { Role } from '../../shared/constants/roles';
import { Logger } from '../../core/utils/logger';

export class CourseController {
  /**
   * Get list of all courses
   */
  async listCourses() {
    try {
      Logger.info('CourseController.listCourses called');
      const courses = await courseService.getAllCourses();
      return { success: true, data: courses, error: null };
    } catch (error: any) {
      Logger.error('CourseController.listCourses failed', error);
      return { success: false, data: null, error: error.message || 'Failed to list courses.' };
    }
  }

  /**
   * Get courses taught by instructor
   */
  async listInstructorCourses(instructorId: string) {
    try {
      Logger.info(`CourseController.listInstructorCourses called for instructor: ${instructorId}`);
      const courses = await courseService.getCoursesByInstructor(instructorId);
      return { success: true, data: courses, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.listInstructorCourses failed for instructor: ${instructorId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to list instructor courses.' };
    }
  }

  /**
   * Get enrolled courses for a student
   */
  async listStudentEnrolledCourses(studentId: string) {
    try {
      Logger.info(`CourseController.listStudentEnrolledCourses called for student: ${studentId}`);
      const enrollments = await courseService.getStudentEnrolledCourses(studentId);
      return { success: true, data: enrollments, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.listStudentEnrolledCourses failed for student: ${studentId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to list enrolled courses.' };
    }
  }

  /**
   * Get syllabus details
   */
  async getCourseSyllabus(courseId: string) {
    try {
      Logger.info(`CourseController.getCourseSyllabus called for course: ${courseId}`);
      if (!courseId) {
        return { success: false, data: null, error: 'Course ID is required.' };
      }
      const syllabus = await courseService.getCourseSyllabus(courseId);
      return { success: true, data: syllabus, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.getCourseSyllabus failed for course: ${courseId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to get course syllabus.' };
    }
  }

  /**
   * Check enrollment status
   */
  async checkEnrollmentStatus(userId: string, courseId: string) {
    try {
      Logger.info(`CourseController.checkEnrollmentStatus called for user: ${userId}, course: ${courseId}`);
      const enrolled = await courseService.isEnrolled(userId, courseId);
      return { success: true, data: { enrolled }, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.checkEnrollmentStatus failed for user: ${userId}, course: ${courseId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to check enrollment status.' };
    }
  }

  /**
   * Create course
   */
  async createCourse(body: any, instructorId: string) {
    try {
      Logger.info(`CourseController.createCourse called by instructor: ${instructorId}`, { title: body?.title, category: body?.category });
      const {
        title,
        description,
        category,
        thumbnailUrl,
        categoryId,
        level,
        status,
        faq,
        requirements,
        outcomes,
        price,
        expiry,
      } = body;
      if (!title || !description || !category) {
        return { success: false, data: null, error: 'Title, description, and category are required.' };
      }
      const course = await courseService.createCourse({
        title,
        description,
        category,
        thumbnailUrl: thumbnailUrl || null,
        instructorId,
        categoryId: categoryId || null,
        level: level || 'Beginner',
        status: status || 'ACTIVE',
        faq: faq || null,
        requirements: requirements || null,
        outcomes: outcomes || null,
        price: price ? Number(price) : undefined,
        expiry: expiry || null,
      });
      Logger.info(`CourseController.createCourse success. Course ID: ${course.id}`);
      return { success: true, data: course, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.createCourse failed for instructor: ${instructorId}`, error, { title: body?.title });
      return { success: false, data: null, error: error.message || 'Failed to create course.' };
    }
  }

  /**
   * Update course
   */
  async updateCourse(courseId: string, body: any, userId: string, role: Role) {
    try {
      Logger.info(`CourseController.updateCourse called for course: ${courseId} by user: ${userId} (${role})`);
      const {
        title,
        description,
        category,
        thumbnailUrl,
        categoryId,
        price,
        expiry,
        level,
        status,
        faq,
        requirements,
        outcomes,
        approvalStatus,
      } = body;
      const course = await courseService.updateCourse(
        courseId,
        {
          title,
          description,
          category,
          thumbnailUrl,
          categoryId,
          price: price !== undefined ? Number(price) : undefined,
          expiry,
          level,
          status,
          faq,
          requirements,
          outcomes,
          approvalStatus,
        },
        userId,
        role
      );
      Logger.info(`CourseController.updateCourse success. Course ID: ${courseId}`);
      return { success: true, data: course, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.updateCourse failed for course: ${courseId} by user: ${userId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to update course.' };
    }
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string, userId: string, role: Role) {
    try {
      Logger.info(`CourseController.deleteCourse called for course: ${courseId} by user: ${userId} (${role})`);
      const course = await courseService.deleteCourse(courseId, userId, role);
      Logger.info(`CourseController.deleteCourse success. Course ID: ${courseId}`);
      return { success: true, data: course, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.deleteCourse failed for course: ${courseId} by user: ${userId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to delete course.' };
    }
  }

  /**
   * Enroll in a course
   */
  async enrollStudent(userId: string, courseId: string) {
    try {
      Logger.info(`CourseController.enrollStudent called for student: ${userId}, course: ${courseId}`);
      if (!courseId) {
        return { success: false, data: null, error: 'Course ID is required.' };
      }
      const enrollment = await courseService.enrollStudent(userId, courseId);
      Logger.info(`CourseController.enrollStudent success for student: ${userId}, course: ${courseId}`);
      return { success: true, data: enrollment, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.enrollStudent failed for student: ${userId}, course: ${courseId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to enroll student.' };
    }
  }

  /**
   * Create module
   */
  async createModule(body: any, userId: string, role: Role) {
    try {
      Logger.info(`CourseController.createModule called for course: ${body?.courseId} by user: ${userId}`);
      const { courseId, title, order } = body;
      if (!courseId || !title || order === undefined) {
        return { success: false, data: null, error: 'courseId, title, and order are required.' };
      }
      const mod = await courseService.createModule(
        { courseId, title, order: Number(order) },
        userId,
        role
      );
      Logger.info(`CourseController.createModule success. Module ID: ${mod.id}`);
      return { success: true, data: mod, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.createModule failed for course: ${body?.courseId} by user: ${userId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to create module.' };
    }
  }

  /**
   * Update module
   */
  async updateModule(moduleId: string, body: any, userId: string, role: Role) {
    try {
      Logger.info(`CourseController.updateModule called for module: ${moduleId} by user: ${userId}`);
      const { title, order } = body;
      const mod = await courseService.updateModule(
        moduleId,
        { title, order: order !== undefined ? Number(order) : undefined },
        userId,
        role
      );
      Logger.info(`CourseController.updateModule success. Module ID: ${moduleId}`);
      return { success: true, data: mod, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.updateModule failed for module: ${moduleId} by user: ${userId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to update module.' };
    }
  }

  /**
   * Delete module
   */
  async deleteModule(moduleId: string, userId: string, role: Role) {
    try {
      Logger.info(`CourseController.deleteModule called for module: ${moduleId} by user: ${userId}`);
      const mod = await courseService.deleteModule(moduleId, userId, role);
      Logger.info(`CourseController.deleteModule success. Module ID: ${moduleId}`);
      return { success: true, data: mod, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.deleteModule failed for module: ${moduleId} by user: ${userId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to delete module.' };
    }
  }

  /**
   * Create lesson
   */
  async createLesson(body: any, userId: string, role: Role) {
    try {
      Logger.info(`CourseController.createLesson called for module: ${body?.moduleId} by user: ${userId}`);
      const { moduleId, title, content, videoUrl, type, order, duration } = body;
      if (!moduleId || !title || order === undefined) {
        return { success: false, data: null, error: 'moduleId, title, and order are required.' };
      }
      const lesson = await courseService.createLesson(
        { 
          moduleId, 
          title, 
          content, 
          videoUrl, 
          type, 
          order: Number(order),
          duration: duration !== undefined ? Number(duration) : undefined
        },
        userId,
        role
      );
      Logger.info(`CourseController.createLesson success. Lesson ID: ${lesson.id}`);
      return { success: true, data: lesson, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.createLesson failed for module: ${body?.moduleId} by user: ${userId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to create lesson.' };
    }
  }

  /**
   * Update lesson
   */
  async updateLesson(lessonId: string, body: any, userId: string, role: Role) {
    try {
      Logger.info(`CourseController.updateLesson called for lesson: ${lessonId} by user: ${userId}`);
      const { title, content, videoUrl, type, order, duration } = body;
      const lesson = await courseService.updateLesson(
        lessonId,
        {
          title,
          content,
          videoUrl,
          type,
          order: order !== undefined ? Number(order) : undefined,
          duration: duration !== undefined ? Number(duration) : undefined,
        },
        userId,
        role
      );
      Logger.info(`CourseController.updateLesson success. Lesson ID: ${lessonId}`);
      return { success: true, data: lesson, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.updateLesson failed for lesson: ${lessonId} by user: ${userId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to update lesson.' };
    }
  }

  /**
   * Delete lesson
   */
  async deleteLesson(lessonId: string, userId: string, role: Role) {
    try {
      Logger.info(`CourseController.deleteLesson called for lesson: ${lessonId} by user: ${userId}`);
      const lesson = await courseService.deleteLesson(lessonId, userId, role);
      Logger.info(`CourseController.deleteLesson success. Lesson ID: ${lessonId}`);
      return { success: true, data: lesson, error: null };
    } catch (error: any) {
      Logger.error(`CourseController.deleteLesson failed for lesson: ${lessonId} by user: ${userId}`, error);
      return { success: false, data: null, error: error.message || 'Failed to delete lesson.' };
    }
  }
}

export const courseController = new CourseController();
export default courseController;
