import { supabase } from '../core/config/supabase';

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleInput {
  courseId: string;
  title: string;
  order: number;
}

export interface UpdateModuleInput {
  title?: string;
  order?: number;
}

export class ModuleRepository {
  /**
   * Find modules by Course ID ordered by sequence order
   */
  async findByCourseId(courseId: string): Promise<Module[]> {
    const { data, error } = await supabase
      .from('Module')
      .select('*')
      .eq('courseId', courseId)
      .order('order', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find a module by ID
   */
  async findById(id: string): Promise<Module | null> {
    const { data, error } = await supabase
      .from('Module')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Create a new module
   */
  async create(data: CreateModuleInput): Promise<Module> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      courseId: data.courseId,
      title: data.title,
      order: data.order,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdModule, error } = await supabase
      .from('Module')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdModule;
  }

  /**
   * Update a module
   */
  async update(id: string, data: UpdateModuleInput): Promise<Module> {
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    const { data: updatedModule, error } = await supabase
      .from('Module')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedModule;
  }

  /**
   * Delete a module by ID
   */
  async delete(id: string): Promise<Module> {
    const { data: deletedModule, error } = await supabase
      .from('Module')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return deletedModule;
  }
}

export const moduleRepository = new ModuleRepository();
export default moduleRepository;
