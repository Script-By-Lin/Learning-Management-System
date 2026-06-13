import { APIResponse } from './authService';

export const courseService = {
  /**
   * Get all courses
   */
  async getCourses(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/courses');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch courses.' };
    }
  },

  /**
   * Get courses student is enrolled in
   */
  async getEnrolledCourses(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/courses/enrolled');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch enrolled courses.' };
    }
  },

  /**
   * Get courses taught by this instructor
   */
  async getTeachingCourses(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/courses/teaching');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch teaching courses.' };
    }
  },

  /**
   * Get syllabus details for a course
   */
  async getCourseSyllabus(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch syllabus.' };
    }
  },

  /**
   * Check if user is enrolled in a course
   */
  async checkEnrollment(courseId: string): Promise<APIResponse<{ enrolled: boolean }>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to check enrollment.' };
    }
  },

  /**
   * Enroll user in a course
   */
  async enroll(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to enroll.' };
    }
  },

  /**
   * Create a new course
   */
  async createCourse(data: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create course.' };
    }
  },

  /**
   * Update course details
   */
  async updateCourse(courseId: string, data: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update course.' };
    }
  },

  /**
   * Delete course
   */
  async deleteCourse(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to delete course.' };
    }
  },

  /**
   * Create a new module inside a course
   */
  async createModule(courseId: string, data: { title: string; order: number }): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create module.' };
    }
  },

  /**
   * Update module details
   */
  async updateModule(moduleId: string, data: { title?: string; order?: number }): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update module.' };
    }
  },

  /**
   * Delete module
   */
  async deleteModule(moduleId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/modules/${moduleId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to delete module.' };
    }
  },

  /**
   * Create a new lesson inside a module
   */
  async createLesson(moduleId: string, data: { title: string; content?: string | null; videoUrl?: string | null; type?: string; order: number; duration?: number }): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create lesson.' };
    }
  },

  /**
   * Update lesson details
   */
  async updateLesson(lessonId: string, data: { title?: string; content?: string | null; videoUrl?: string | null; type?: string; order?: number; duration?: number }): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update lesson.' };
    }
  },

  /**
   * Delete lesson
   */
  async deleteLesson(lessonId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to delete lesson.' };
    }
  },

  /**
   * Get quizzes in a course
   */
  async getQuizzes(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/quizzes`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch quizzes.' };
    }
  },

  /**
   * Create new Quiz
   */
  async createQuiz(courseId: string, data: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create quiz.' };
    }
  },

  /**
   * Get quiz details + questions
   */
  async getQuizDetails(quizId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch quiz details.' };
    }
  },

  /**
   * Submit quiz answers (auto-graded)
   */
  async submitQuiz(quizId: string, answers: number[]): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to submit quiz.' };
    }
  },

  /**
   * Get assignments in a course
   */
  async getAssignments(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/assignments`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch assignments.' };
    }
  },

  /**
   * Create new assignment
   */
  async createAssignment(courseId: string, data: any): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create assignment.' };
    }
  },

  /**
   * Check student's submission status for an assignment
   */
  async checkAssignmentSubmission(assignmentId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submit`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to check assignment status.' };
    }
  },

  /**
   * Submit assignment text/files
   */
  async submitAssignment(assignmentId: string, data: { submissionText?: string | null; fileUrl?: string | null }): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to submit assignment.' };
    }
  },

  /**
   * List all student submissions for an assignment (Instructor only)
   */
  async getAssignmentSubmissions(assignmentId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/submissions`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch submissions.' };
    }
  },

  /**
   * Grade student submission (Instructor only)
   */
  async gradeSubmission(submissionId: string, data: { grade: number; feedback?: string | null }): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to grade submission.' };
    }
  },

  /**
   * Get discussions for a course
   */
  async getDiscussions(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/discussions`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch discussions.' };
    }
  },

  /**
   * Post discussion comment/reply
   */
  async postDiscussion(courseId: string, data: { content: string; parentId?: string | null }): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to post comment.' };
    }
  },

  /**
   * Get announcements for a course
   */
  async getAnnouncements(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/announcements`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch announcements.' };
    }
  },

  /**
   * Post course announcement (Instructor only)
   */
  async postAnnouncement(courseId: string, data: { title: string; content: string }): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to post announcement.' };
    }
  },

  /**
   * Get completion progress of a lesson for the current user
   */
  async getLessonProgress(lessonId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch lesson progress.' };
    }
  },

  /**
   * Toggle completion progress of a lesson
   */
  async toggleLessonProgress(lessonId: string, completed: boolean): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update lesson progress.' };
    }
  },

  /**
   * Get user conversation lists
   */
  async getConversations(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/messages/conversations');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch conversations.' };
    }
  },

  /**
   * Start a new conversation thread with a participant
   */
  async startConversation(recipientId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to start conversation.' };
    }
  },

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch messages.' };
    }
  },

  /**
   * Send a direct message inside a conversation
   */
  async sendMessage(conversationId: string, content: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/messages/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to send message.' };
    }
  },

  /**
   * Check course progress and issue completion certificate code
   */
  async getCertificate(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/certificate`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch certificate.' };
    }
  },

  /**
   * Get student course progress stats
   */
  async getCourseProgress(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/courses/${courseId}/progress`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch course progress.' };
    }
  },

  /**
   * Get all certificates issued for the current student
   */
  async getUserCertificates(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/users/certificates');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch certificates.' };
    }
  },

  /**
   * Get list of potential messaging recipients
   */
  async getRecipients(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/messages/recipients');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch recipients.' };
    }
  },

  /**
   * Update watch progress for a video lesson
   */
  async updateWatchProgress(
    lessonId: string,
    courseId: string,
    watchedSeconds: number,
    totalSeconds: number,
    lastPosition: number
  ): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/watch/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, courseId, watchedSeconds, totalSeconds, lastPosition }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update watch progress.' };
    }
  },

  /**
   * Get student watch analytics (total time, streak, weekly chart, etc.)
   */
  async getWatchAnalytics(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/watch/analytics');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch watch analytics.' };
    }
  },

  /**
   * Get per-lesson watch stats for a specific course
   */
  async getCourseWatchStats(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/watch/course/${courseId}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch course watch stats.' };
    }
  },

  /**
   * Get instructor analytics (student engagement, watch time, etc.)
   */
  async getInstructorAnalytics(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/instructor/analytics');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch instructor analytics.' };
    }
  },

  /**
   * Get all categories from backend
   */
  async getCategories(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/categories');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch categories.' };
    }
  },

  /**
   * Create a new category (Admin only)
   */
  async createCategory(name: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create category.' };
    }
  },

  /**
   * Delete a category (Admin only)
   */
  async deleteCategory(id: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to delete category.' };
    }
  },

  /**
   * Approve or Deny/Reject user account (Admin only)
   */
  async approveUser(userId: string, isApproved: boolean): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/users/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isApproved }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to update user approval status.' };
    }
  },

  /**
   * Submit student manual offline payment receipt file
   */
  async submitOfflinePayment(courseId: string, amount: string, receiptFile: File): Promise<APIResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('amount', amount);
      formData.append('receiptFile', receiptFile);

      const response = await fetch('/api/payments/offline', {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to submit payment receipt.' };
    }
  },

  /**
   * Check offline payment status for a course
   */
  async getOfflinePaymentStatus(courseId: string): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/payments/status?courseId=${courseId}`);
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch payment status.' };
    }
  },

  /**
   * Fetch all offline payment requests (Admin only)
   */
  async getOfflinePayments(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/admin/payments');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch offline payment records.' };
    }
  },

  /**
   * Review/Approve/Reject manual offline payment request (Admin only)
   */
  async reviewOfflinePayment(paymentId: string, status: 'APPROVED' | 'REJECTED'): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, status }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to submit review action.' };
    }
  },

  /**
   * Register a new user account (Admin only)
   */
  async adminCreateUser(data: { email: string; password: string; fullName: string; role: 'STUDENT' | 'INSTRUCTOR' }): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create user account.' };
    }
  },

  /**
   * Upload course thumbnail file
   */
  async uploadThumbnail(thumbnailFile: File): Promise<APIResponse<{ thumbnailUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('thumbnailFile', thumbnailFile);

      const response = await fetch('/api/courses/upload-thumbnail', {
        method: 'POST',
        body: formData,
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to upload thumbnail.' };
    }
  },

  /**
   * Fetch support tickets (Admin only)
   */
  async getTickets(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/tickets');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch tickets.' };
    }
  },

  /**
   * Submit support ticket (Public)
   */
  async submitTicket(data: { name: string; email: string; subject: string; message: string }): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to submit support ticket.' };
    }
  },

  /**
   * Resolve support ticket (Admin only)
   */
  async resolveTicket(id: string, resolved: boolean): Promise<APIResponse<any>> {
    try {
      const response = await fetch(`/api/tickets/${id}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to resolve ticket.' };
    }
  },

  /**
   * Fetch blog posts (Public)
   */
  async getBlogs(): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/blogs');
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch blog posts.' };
    }
  },

  /**
   * Create blog post (Admin only)
   */
  async createBlog(data: { title: string; author: string; category: string }): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create blog post.' };
    }
  },

  /**
   * Broadcast newsletter to students (Admin only)
   */
  async broadcastNewsletter(data: { subject: string; message: string }): Promise<APIResponse<any>> {
    try {
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to broadcast newsletter.' };
    }
  },
};

export default courseService;
