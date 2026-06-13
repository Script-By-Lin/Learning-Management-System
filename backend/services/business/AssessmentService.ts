import { quizRepository, Quiz, QuizQuestion, QuizSubmission } from '../../repositories/QuizRepository';
import { assignmentRepository, Assignment, AssignmentSubmission } from '../../repositories/AssignmentRepository';
import { courseRepository } from '../../repositories/CourseRepository';
import { userRepository } from '../../repositories/UserRepository';
import { emailService } from '../../integrations/emailService';
import { Role } from '../../shared/constants/roles';

export class AssessmentService {
  /**
   * Helper: Check if user is allowed to modify course assessments
   */
  private async checkCourseOwnership(courseId: string, userId: string, role: Role): Promise<void> {
    if (role === Role.ADMIN) return;
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Course not found.');
    }
    if (course.instructorId !== userId) {
      throw new Error('Access denied: You are not the instructor of this course.');
    }
  }

  /**
   * Helper: Check ownership for submission grading
   */
  private async checkSubmissionGradingPermission(submissionId: string, userId: string, role: Role): Promise<void> {
    if (role === Role.ADMIN) return;
    const submission = await assignmentRepository.findSubmissionById(submissionId);
    if (!submission) {
      throw new Error('Submission not found.');
    }
    const assignment = await assignmentRepository.findById(submission.assignmentId);
    if (!assignment) {
      throw new Error('Assignment associated with submission not found.');
    }
    await this.checkCourseOwnership(assignment.courseId, userId, role);
  }

  // --- QUIZZES BUSINESS METHODS ---

  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    return quizRepository.findByCourseId(courseId);
  }

  async getQuizDetails(quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[] }> {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw new Error('Quiz not found.');
    }
    const questions = await quizRepository.findQuestionsByQuizId(quizId);
    return { quiz, questions };
  }

  async createQuiz(
    courseId: string,
    title: string,
    description: string | null,
    questions: Array<{ questionText: string; options: string[]; correctOptionIndex: number }>,
    userId: string,
    role: Role
  ): Promise<{ quiz: Quiz; questions: QuizQuestion[] }> {
    await this.checkCourseOwnership(courseId, userId, role);

    const quiz = await quizRepository.create(courseId, title, description);
    const createdQuestions = await Promise.all(
      questions.map((q) =>
        quizRepository.createQuestion(quiz.id, q.questionText, q.options, q.correctOptionIndex)
      )
    );

    return { quiz, questions: createdQuestions };
  }

  /**
   * Auto-grading execution logic
   */
  async submitQuiz(quizId: string, userId: string, answers: number[]): Promise<QuizSubmission> {
    const questions = await quizRepository.findQuestionsByQuizId(quizId);
    if (questions.length === 0) {
      throw new Error('Cannot submit quiz: No questions defined.');
    }

    if (answers.length !== questions.length) {
      throw new Error(`Invalid request: Must provide answers for all ${questions.length} questions.`);
    }

    // Auto grading count
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });

    const score = (correctCount / questions.length) * 100;
    const passed = score >= 60.0; // 60% passing mark

    const submission = await quizRepository.createSubmission(quizId, userId, answers, score, passed);

    // Trigger quiz results email asynchronously
    try {
      const student = await userRepository.findById(userId);
      const quiz = await quizRepository.findById(quizId);
      if (student && quiz) {
        emailService.sendResultEmail(student.email, student.fullName, quiz.title, score, passed);
      }
    } catch (e) {
      console.error('Failed to send quiz results email notification:', e);
    }

    return submission;
  }

  async getQuizSubmissions(userId: string, quizId: string): Promise<QuizSubmission[]> {
    return quizRepository.findSubmissionsByUserAndQuiz(userId, quizId);
  }

  // --- ASSIGNMENTS BUSINESS METHODS ---

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return assignmentRepository.findByCourseId(courseId);
  }

  async createAssignment(
    courseId: string,
    title: string,
    description: string,
    dueDate: string | null,
    userId: string,
    role: Role
  ): Promise<Assignment> {
    await this.checkCourseOwnership(courseId, userId, role);
    return assignmentRepository.create(courseId, title, description, dueDate);
  }

  async submitAssignment(
    assignmentId: string,
    studentId: string,
    submissionText?: string | null,
    fileUrl?: string | null
  ): Promise<AssignmentSubmission> {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found.');
    }

    const existing = await assignmentRepository.findByAssignmentAndStudent(assignmentId, studentId);
    if (existing) {
      throw new Error('You have already submitted this assignment.');
    }

    return assignmentRepository.createSubmission(assignmentId, studentId, submissionText, fileUrl);
  }

  async getStudentSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    return assignmentRepository.findByAssignmentAndStudent(assignmentId, studentId);
  }

  async listAssignmentSubmissions(assignmentId: string, userId: string, role: Role): Promise<AssignmentSubmission[]> {
    const assignment = await assignmentRepository.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found.');
    }
    await this.checkCourseOwnership(assignment.courseId, userId, role);
    return assignmentRepository.findSubmissionsByAssignment(assignmentId);
  }

  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string | null,
    instructorId: string,
    role: Role
  ): Promise<AssignmentSubmission> {
    await this.checkSubmissionGradingPermission(submissionId, instructorId, role);
    if (grade < 0 || grade > 100) {
      throw new Error('Grade must be between 0 and 100.');
    }
    return assignmentRepository.gradeSubmission(submissionId, grade, feedback);
  }
}

export const assessmentService = new AssessmentService();
export default assessmentService;
