import { supabase } from '../core/config/supabase';

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  options: string[]; // JSON array of options
  correctOptionIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  answers: number[]; // JSON array of selected choice indexes
  score: number;
  passed: boolean;
  submittedAt: string;
}

export class QuizRepository {
  /**
   * Find quizzes in a course
   */
  async findByCourseId(courseId: string): Promise<Quiz[]> {
    const { data, error } = await supabase
      .from('Quiz')
      .select('*')
      .eq('courseId', courseId)
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Find quiz by ID
   */
  async findById(id: string): Promise<Quiz | null> {
    const { data, error } = await supabase
      .from('Quiz')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Create new Quiz
   */
  async create(courseId: string, title: string, description?: string | null): Promise<Quiz> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      courseId,
      title,
      description: description ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('Quiz')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Delete quiz by ID
   */
  async delete(id: string): Promise<Quiz> {
    const { data, error } = await supabase
      .from('Quiz')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Find questions belonging to a quiz
   */
  async findQuestionsByQuizId(quizId: string): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
      .from('QuizQuestion')
      .select('*')
      .eq('quizId', quizId)
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Create quiz question
   */
  async createQuestion(
    quizId: string,
    questionText: string,
    options: string[],
    correctOptionIndex: number
  ): Promise<QuizQuestion> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      quizId,
      questionText,
      options, // stored as jsonb array
      correctOptionIndex,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('QuizQuestion')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Delete question
   */
  async deleteQuestion(id: string): Promise<QuizQuestion> {
    const { data, error } = await supabase
      .from('QuizQuestion')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Find student's submissions for a quiz
   */
  async findSubmissionsByUserAndQuiz(userId: string, quizId: string): Promise<QuizSubmission[]> {
    const { data, error } = await supabase
      .from('QuizSubmission')
      .select('*')
      .eq('userId', userId)
      .eq('quizId', quizId)
      .order('submittedAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Create quiz submission
   */
  async createSubmission(
    quizId: string,
    userId: string,
    answers: number[],
    score: number,
    passed: boolean
  ): Promise<QuizSubmission> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      quizId,
      userId,
      answers, // stored as jsonb array
      score,
      passed,
      submittedAt: now,
    };

    const { data, error } = await supabase
      .from('QuizSubmission')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * List all submissions for a quiz (useful for instructor dashboard overview)
   */
  async findSubmissionsByQuizId(quizId: string): Promise<QuizSubmission[]> {
    const { data, error } = await supabase
      .from('QuizSubmission')
      .select('*')
      .eq('quizId', quizId)
      .order('submittedAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }
}

export const quizRepository = new QuizRepository();
export default quizRepository;
