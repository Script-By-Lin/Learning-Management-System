import { supabase } from '../core/config/supabase';
import { Role } from '../shared/constants/roles';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: Role;
  isApproved: boolean;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  role?: Role;
  isApproved?: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface UpdateUserInput {
  email?: string;
  passwordHash?: string;
  fullName?: string;
  role?: Role;
  isApproved?: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
}

export class UserRepository {
  /**
   * Find a user by their unique email address
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find a user by their unique ID
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Find all users ordered by creation date
   */
  async findAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create a new user in the database
   */
  async create(data: CreateUserInput): Promise<User> {
    // Generate UUID locally or let database default it. Since id is text, we can use crypto.randomUUID()
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Instructors require admin approval, other roles are approved by default
    const isApproved = data.isApproved ?? (data.role === Role.INSTRUCTOR ? false : true);

    const insertData = {
      id,
      email: data.email,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      role: data.role ?? Role.STUDENT,
      isApproved,
      avatarUrl: data.avatarUrl ?? null,
      bio: data.bio ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdUser, error } = await supabase
      .from('User')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdUser;
  }

  /**
   * Update an existing user's details
   */
  async update(id: string, data: UpdateUserInput): Promise<User> {
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      updatedAt: now,
    };

    const { data: updatedUser, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return updatedUser;
  }

  /**
   * Delete a user by ID
   */
  async delete(id: string): Promise<User> {
    const { data: deletedUser, error } = await supabase
      .from('User')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return deletedUser;
  }
}

export const userRepository = new UserRepository();
export default userRepository;
