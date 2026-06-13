import { supabase } from '../core/config/supabase';

export interface Blog {
  id: string;
  title: string;
  author: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogInput {
  title: string;
  author: string;
  category: string;
}

export class BlogRepository {
  /**
   * Find all blog posts ordered by creation date (newest first)
   */
  async findAll(): Promise<Blog[]> {
    const { data, error } = await supabase
      .from('Blog')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new blog post
   */
  async create(data: CreateBlogInput): Promise<Blog> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      title: data.title,
      author: data.author,
      category: data.category,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdBlog, error } = await supabase
      .from('Blog')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdBlog;
  }
}

export const blogRepository = new BlogRepository();
export default blogRepository;
