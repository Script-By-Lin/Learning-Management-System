import { courseRepository, Course, CreateCourseInput, UpdateCourseInput } from '../../repositories/CourseRepository';
import { moduleRepository, Module, CreateModuleInput, UpdateModuleInput } from '../../repositories/ModuleRepository';
import { lessonRepository, Lesson, CreateLessonInput, UpdateLessonInput } from '../../repositories/LessonRepository';
import { enrollmentRepository, Enrollment } from '../../repositories/EnrollmentRepository';
import { userRepository } from '../../repositories/UserRepository';
import { emailService } from '../../integrations/emailService';
import { Role } from '../../shared/constants/roles';
import { offlinePaymentRepository, OfflinePayment } from '../../repositories/OfflinePaymentRepository';

export interface StructuredSyllabus {
  course: Course & { 
    instructorName?: string;
    instructorBio?: string | null;
    instructorAvatarUrl?: string | null;
  };
  modules: Array<Module & { lessons: Lesson[] }>;
}

export class CourseService {
  /**
   * Helper: Check if user is allowed to edit the course
   */
  private async checkCourseOwnership(courseId: string, userId: string, role: Role): Promise<Course> {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found.');
    }
    if (role !== Role.ADMIN && course.instructorId !== userId) {
      throw new Error('Access denied: You are not the instructor of this course.');
    }
    return course;
  }

  /**
   * Helper: Check if user has access to edit module's course
   */
  private async checkModuleCourseOwnership(moduleId: string, userId: string, role: Role): Promise<Module> {
    const moduleItem = await moduleRepository.findById(moduleId);
    if (!moduleItem) {
      throw new Error('Module not found.');
    }
    await this.checkCourseOwnership(moduleItem.courseId, userId, role);
    return moduleItem;
  }

  /**
   * Helper: Check if user has access to edit lesson's course
   */
  private async checkLessonCourseOwnership(lessonId: string, userId: string, role: Role): Promise<Lesson> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found.');
    }
    const moduleItem = await moduleRepository.findById(lesson.moduleId);
    if (!moduleItem) {
      throw new Error('Module containing the lesson not found.');
    }
    await this.checkCourseOwnership(moduleItem.courseId, userId, role);
    return lesson;
  }

  /**
   * List all courses
   */
  async getAllCourses(): Promise<Course[]> {
    return courseRepository.findAll();
  }

  /**
   * Get courses taught by instructor
   */
  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    return courseRepository.findByInstructorId(instructorId);
  }

  /**
   * Get courses a student is enrolled in
   */
  async getStudentEnrolledCourses(studentId: string): Promise<Enrollment[]> {
    return enrollmentRepository.findByUserId(studentId);
  }

  /**
   * Get full syllabus details of a course (Course + Modules + Lessons)
   */
  async getCourseSyllabus(courseId: string): Promise<StructuredSyllabus> {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found.');
    }

    const instructor = await userRepository.findById(course.instructorId);

    const modules = await moduleRepository.findByCourseId(courseId);
    const structuredModules = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await lessonRepository.findByModuleId(mod.id);
        return {
          ...mod,
          lessons,
        };
      })
    );

    return {
      course: {
        ...course,
        instructorName: instructor ? instructor.fullName : 'Unknown Instructor',
        instructorBio: instructor ? instructor.bio : null,
        instructorAvatarUrl: instructor ? instructor.avatarUrl : null,
      },
      modules: structuredModules,
    };
  }

  /**
   * Check if a student is enrolled in a course
   */
  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const enrollment = await enrollmentRepository.findByUserAndCourse(userId, courseId);
    return !!enrollment;
  }

  /**
   * Create a new course (restricted to INSTRUCTOR/ADMIN via middleware/controllers)
   */
  async createCourse(data: CreateCourseInput): Promise<Course> {
    const instructor = await userRepository.findById(data.instructorId);
    if (!instructor) {
      throw new Error('Instructor not found.');
    }
    if (!instructor.isApproved) {
      throw new Error('Your instructor account must be approved by an administrator before you can publish or manage courses.');
    }
    return courseRepository.create(data);
  }

  /**
   * Update course details
   */
  async updateCourse(courseId: string, data: UpdateCourseInput, userId: string, role: Role): Promise<Course> {
    await this.checkCourseOwnership(courseId, userId, role);
    return courseRepository.update(courseId, data);
  }

  /**
   * Delete course (and its cascade records handled inside repo or naturally)
   */
  async deleteCourse(courseId: string, userId: string, role: Role): Promise<Course> {
    await this.checkCourseOwnership(courseId, userId, role);
    return courseRepository.delete(courseId);
  }

  /**
   * Enroll a student in a course
   */
  async enrollStudent(userId: string, courseId: string): Promise<Enrollment> {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found.');
    }

    const existing = await enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (existing) {
      return existing;
    }

    const enrollment = await enrollmentRepository.create(userId, courseId);

    // Trigger enrollment email asynchronously
    try {
      const student = await userRepository.findById(userId);
      if (student) {
        emailService.sendEnrollmentEmail(student.email, student.fullName, course.title);
      }
    } catch (e) {
      console.error('Failed to send enrollment email notification:', e);
    }

    return enrollment;
  }

  /**
   * Create a new module inside a course
   */
  async createModule(data: CreateModuleInput, userId: string, role: Role): Promise<Module> {
    await this.checkCourseOwnership(data.courseId, userId, role);
    return moduleRepository.create(data);
  }

  /**
   * Update module
   */
  async updateModule(moduleId: string, data: UpdateModuleInput, userId: string, role: Role): Promise<Module> {
    const mod = await this.checkModuleCourseOwnership(moduleId, userId, role);
    return moduleRepository.update(moduleId, data);
  }

  /**
   * Delete module
   */
  async deleteModule(moduleId: string, userId: string, role: Role): Promise<Module> {
    await this.checkModuleCourseOwnership(moduleId, userId, role);
    return moduleRepository.delete(moduleId);
  }

  /**
   * Create a lesson in a module
   */
  async createLesson(data: CreateLessonInput, userId: string, role: Role): Promise<Lesson> {
    const mod = await moduleRepository.findById(data.moduleId);
    if (!mod) {
      throw new Error('Module not found.');
    }
    await this.checkCourseOwnership(mod.courseId, userId, role);
    return lessonRepository.create(data);
  }

  /**
   * Update lesson
   */
  async updateLesson(lessonId: string, data: UpdateLessonInput, userId: string, role: Role): Promise<Lesson> {
    await this.checkLessonCourseOwnership(lessonId, userId, role);
    return lessonRepository.update(lessonId, data);
  }

  /**
   * Delete lesson
   */
  async deleteLesson(lessonId: string, userId: string, role: Role): Promise<Lesson> {
    await this.checkLessonCourseOwnership(lessonId, userId, role);
    return lessonRepository.delete(lessonId);
  }

  /**
   * Submit offline payment receipt details for a course
   */
  async submitOfflinePayment(userId: string, courseId: string, amount: string, receiptUrl: string): Promise<OfflinePayment> {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found.');
    }

    // Check if they are already enrolled
    const enrolled = await enrollmentRepository.findByUserAndCourse(userId, courseId);
    if (enrolled) {
      throw new Error('You are already enrolled in this course.');
    }

    // Check existing payment records
    const existingPayment = await offlinePaymentRepository.findByUserAndCourse(userId, courseId);
    if (existingPayment) {
      if (existingPayment.status === 'APPROVED') {
        throw new Error('This course has already been paid for and approved.');
      }
      if (existingPayment.status === 'PENDING') {
        throw new Error('A payment receipt for this course is already pending approval.');
      }
      // If rejected, let's update it with the new receipt
      return offlinePaymentRepository.updateReceipt(existingPayment.id, amount, receiptUrl);
    }

    return offlinePaymentRepository.create({ userId, courseId, amount, receiptUrl });
  }

  /**
   * Fetch payment status for a course
   */
  async getOfflinePaymentStatus(userId: string, courseId: string): Promise<OfflinePayment | null> {
    return offlinePaymentRepository.findByUserAndCourse(userId, courseId);
  }

  /**
   * List all offline payments (Admin review list)
   */
  async getOfflinePayments(): Promise<OfflinePayment[]> {
    return offlinePaymentRepository.findAll();
  }

  /**
   * Review offline manual payment status (APPROVED / REJECTED)
   */
  async reviewOfflinePayment(paymentId: string, status: 'APPROVED' | 'REJECTED'): Promise<OfflinePayment> {
    const payment = await offlinePaymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('Payment record not found.');
    }

    if (payment.status === status) {
      return payment;
    }

    // Update status
    const updatedPayment = await offlinePaymentRepository.updateStatus(paymentId, status);

    // If approved, create enrollment
    if (status === 'APPROVED') {
      try {
        const existing = await enrollmentRepository.findByUserAndCourse(payment.userId, payment.courseId);
        if (!existing) {
          await enrollmentRepository.create(payment.userId, payment.courseId);
          // Trigger enrollment email notification
          try {
            const student = await userRepository.findById(payment.userId);
            const course = await courseRepository.findById(payment.courseId);
            if (student && course) {
              emailService.sendEnrollmentEmail(student.email, student.fullName, course.title);
            }
          } catch (e) {
            console.error('Failed to send enrollment email notification:', e);
          }
        }
      } catch (err: any) {
        console.error('Error creating enrollment on payment approval:', err.message);
      }
    }

    return updatedPayment;
  }
}

export const courseService = new CourseService();
export default courseService;
