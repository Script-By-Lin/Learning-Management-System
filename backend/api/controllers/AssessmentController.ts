import { assessmentService } from '../../services/business/AssessmentService';
import { Role } from '../../shared/constants/roles';

export class AssessmentController {
  async listQuizzes(courseId: string) {
    try {
      const quizzes = await assessmentService.getQuizzesByCourse(courseId);
      return { success: true, data: quizzes, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list quizzes.' };
    }
  }

  async getQuizDetails(quizId: string) {
    try {
      const details = await assessmentService.getQuizDetails(quizId);
      return { success: true, data: details, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to fetch quiz details.' };
    }
  }

  async createQuiz(body: any, instructorId: string, role: Role) {
    try {
      const { courseId, title, description, questions } = body;
      if (!courseId || !title || !Array.isArray(questions)) {
        return { success: false, data: null, error: 'courseId, title, and questions array are required.' };
      }
      const result = await assessmentService.createQuiz(
        courseId,
        title,
        description,
        questions,
        instructorId,
        role
      );
      return { success: true, data: result, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create quiz.' };
    }
  }

  async submitQuiz(quizId: string, userId: string, body: any) {
    try {
      const { answers } = body;
      if (!Array.isArray(answers)) {
        return { success: false, data: null, error: 'answers array is required.' };
      }
      const submission = await assessmentService.submitQuiz(quizId, userId, answers);
      return { success: true, data: submission, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to submit quiz.' };
    }
  }

  async listStudentQuizSubmissions(userId: string, quizId: string) {
    try {
      const submissions = await assessmentService.getQuizSubmissions(userId, quizId);
      return { success: true, data: submissions, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list submissions.' };
    }
  }

  async listAssignments(courseId: string) {
    try {
      const assignments = await assessmentService.getAssignmentsByCourse(courseId);
      return { success: true, data: assignments, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list assignments.' };
    }
  }

  async createAssignment(body: any, instructorId: string, role: Role) {
    try {
      const { courseId, title, description, dueDate } = body;
      if (!courseId || !title || !description) {
        return { success: false, data: null, error: 'courseId, title, and description are required.' };
      }
      const assignment = await assessmentService.createAssignment(
        courseId,
        title,
        description,
        dueDate || null,
        instructorId,
        role
      );
      return { success: true, data: assignment, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to create assignment.' };
    }
  }

  async submitAssignment(assignmentId: string, studentId: string, body: any) {
    try {
      const { submissionText, fileUrl } = body;
      const submission = await assessmentService.submitAssignment(
        assignmentId,
        studentId,
        submissionText,
        fileUrl
      );
      return { success: true, data: submission, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to submit assignment.' };
    }
  }

  async getStudentAssignmentSubmission(assignmentId: string, studentId: string) {
    try {
      const submission = await assessmentService.getStudentSubmission(assignmentId, studentId);
      return { success: true, data: submission, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to check submission.' };
    }
  }

  async listAssignmentSubmissions(assignmentId: string, instructorId: string, role: Role) {
    try {
      const submissions = await assessmentService.listAssignmentSubmissions(assignmentId, instructorId, role);
      return { success: true, data: submissions, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to list submissions.' };
    }
  }

  async gradeSubmission(submissionId: string, body: any, instructorId: string, role: Role) {
    try {
      const { grade, feedback } = body;
      if (grade === undefined) {
        return { success: false, data: null, error: 'grade is required.' };
      }
      const submission = await assessmentService.gradeSubmission(
        submissionId,
        Number(grade),
        feedback || null,
        instructorId,
        role
      );
      return { success: true, data: submission, error: null };
    } catch (error: any) {
      return { success: false, data: null, error: error.message || 'Failed to grade submission.' };
    }
  }
}

export const assessmentController = new AssessmentController();
export default assessmentController;
