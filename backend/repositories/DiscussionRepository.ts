import { supabase } from '../core/config/supabase';

export interface DiscussionPost {
  id: string;
  courseId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface CreatePostInput {
  courseId: string;
  userId: string;
  content: string;
  parentId?: string | null;
}

export class DiscussionRepository {
  /**
   * Find all posts for a course, including author user details
   */
  async findByCourseId(courseId: string): Promise<DiscussionPost[]> {
    const { data, error } = await supabase
      .from('DiscussionPost')
      .select('*, user:User(id, fullName, email, role)')
      .eq('courseId', courseId)
      .order('createdAt', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find post by ID
   */
  async findById(id: string): Promise<DiscussionPost | null> {
    const { data, error } = await supabase
      .from('DiscussionPost')
      .select('*, user:User(id, fullName, email, role)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a discussion post or reply
   */
  async create(data: CreatePostInput): Promise<DiscussionPost> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      courseId: data.courseId,
      userId: data.userId,
      parentId: data.parentId ?? null,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdPost, error } = await supabase
      .from('DiscussionPost')
      .insert(insertData)
      .select('*, user:User(id, fullName, email, role)')
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdPost;
  }

  /**
   * Delete a discussion post by ID
   */
  async delete(id: string): Promise<DiscussionPost> {
    const { data: deletedPost, error } = await supabase
      .from('DiscussionPost')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return deletedPost;
  }
}

export const discussionRepository = new DiscussionRepository();
export default discussionRepository;
