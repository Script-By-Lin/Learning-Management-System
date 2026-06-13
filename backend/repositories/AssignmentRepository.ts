import { supabase } from '../core/config/supabase';

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  submissionText: string | null;
  fileUrl: string | null;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  gradedAt: string | null;
  user?: {
    fullName: string;
    email: string;
  };
}

export class AssignmentRepository {
  /**
   * Find assignments in a course
   */
  async findByCourseId(courseId: string): Promise<Assignment[]> {
    const { data, error } = await supabase
      .from('Assignment')
      .select('*')
      .eq('courseId', courseId)
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Find assignment by ID
   */
  async findById(id: string): Promise<Assignment | null> {
    const { data, error } = await supabase
      .from('Assignment')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Create an assignment
   */
  async create(courseId: string, title: string, description: string, dueDate?: string | null): Promise<Assignment> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      courseId,
      title,
      description,
      dueDate: dueDate ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('Assignment')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Delete assignment by ID
   */
  async delete(id: string): Promise<Assignment> {
    const { data, error } = await supabase
      .from('Assignment')
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
   * Find student's submission for an assignment
   */
  async findByAssignmentAndStudent(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    const { data, error } = await supabase
      .from('AssignmentSubmission')
      .select('*')
      .eq('assignmentId', assignmentId)
      .eq('userId', studentId)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Find student submission by ID
   */
  async findSubmissionById(id: string): Promise<AssignmentSubmission | null> {
    const { data, error } = await supabase
      .from('AssignmentSubmission')
      .select('*, user:User(fullName, email)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Create assignment submission
   */
  async createSubmission(
    assignmentId: string,
    studentId: string,
    submissionText?: string | null,
    fileUrl?: string | null
  ): Promise<AssignmentSubmission> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      assignmentId,
      userId: studentId,
      submissionText: submissionText ?? null,
      fileUrl: fileUrl ?? null,
      grade: null,
      feedback: null,
      submittedAt: now,
      gradedAt: null,
    };

    const { data, error } = await supabase
      .from('AssignmentSubmission')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }

  /**
   * Find all submissions for an assignment
   */
  async findSubmissionsByAssignment(assignmentId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await supabase
      .from('AssignmentSubmission')
      .select('*, user:User(fullName, email)')
      .eq('assignmentId', assignmentId)
      .order('submittedAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Grade submission
   */
  async gradeSubmission(submissionId: string, grade: number, feedback?: string | null): Promise<AssignmentSubmission> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('AssignmentSubmission')
      .update({
        grade,
        feedback: feedback ?? null,
        gradedAt: now,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    return data;
  }
}

export const assignmentRepository = new AssignmentRepository();
export default assignmentRepository;
