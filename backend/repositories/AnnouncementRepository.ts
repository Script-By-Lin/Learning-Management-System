import { supabase } from '../core/config/supabase';

export interface Announcement {
  id: string;
  courseId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementInput {
  courseId: string;
  title: string;
  content: string;
}

export class AnnouncementRepository {
  /**
   * Find announcements by course ID
   */
  async findByCourseId(courseId: string): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('Announcement')
      .select('*')
      .eq('courseId', courseId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find announcement by ID
   */
  async findById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('Announcement')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  }

  /**
   * Create an announcement
   */
  async create(data: CreateAnnouncementInput): Promise<Announcement> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const insertData = {
      id,
      courseId: data.courseId,
      title: data.title,
      content: data.content,
      createdAt: now,
      updatedAt: now,
    };

    const { data: createdAnnouncement, error } = await supabase
      .from('Announcement')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return createdAnnouncement;
  }

  /**
   * Delete announcement by ID
   */
  async delete(id: string): Promise<Announcement> {
    const { data: deletedAnnouncement, error } = await supabase
      .from('Announcement')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return deletedAnnouncement;
  }
}

export const announcementRepository = new AnnouncementRepository();
export default announcementRepository;
