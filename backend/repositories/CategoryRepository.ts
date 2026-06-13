import { supabase } from '../core/config/supabase';

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export class CategoryRepository {
  /**
   * Find all categories ordered by name
   */
  async findAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find a category by ID
   */
  async findById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new category
   */
  async create(name: string): Promise<Category> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdCategory, error } = await supabase
      .from('Category')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdCategory;
  }

  /**
   * Delete a category by ID
   */
  async delete(id: string): Promise<Category> {
    const { data: deletedCategory, error } = await supabase
      .from('Category')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return deletedCategory;
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
