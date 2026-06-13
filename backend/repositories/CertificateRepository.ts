import { supabase } from '../core/config/supabase';

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateCode: string;
  issuedAt: string;
  course?: {
    id: string;
    title: string;
    description: string;
    category: string;
    instructorId?: string;
    instructor?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export class CertificateRepository {
  /**
   * Find certificate by user and course
   */
  async findByUserAndCourse(userId: string, courseId: string): Promise<Certificate | null> {
    const { data: cert, error: certError } = await supabase
      .from('Certificate')
      .select('*')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .maybeSingle();

    if (certError) {
      throw new Error(`Database error: ${certError.message}`);
    }

    if (!cert) return null;

    // Fetch Course details
    const { data: course, error: courseError } = await supabase
      .from('Course')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      throw new Error(`Database error: ${courseError.message}`);
    }

    // Fetch Student User details
    const { data: student, error: studentError } = await supabase
      .from('User')
      .select('id, fullName, email')
      .eq('id', userId)
      .maybeSingle();

    if (studentError) {
      throw new Error(`Database error: ${studentError.message}`);
    }

    // Fetch Instructor User details
    let instructor = null;
    if (course?.instructorId) {
      const { data: inst, error: instError } = await supabase
        .from('User')
        .select('id, fullName, email')
        .eq('id', course.instructorId)
        .maybeSingle();
      if (instError) {
        throw new Error(`Database error: ${instError.message}`);
      }
      instructor = inst;
    }

    return {
      ...cert,
      course: course ? {
        ...course,
        instructor: instructor || undefined
      } : undefined,
      user: student || undefined
    };
  }

  /**
   * Find all certificates for a user
   */
  async findByUserId(userId: string): Promise<Certificate[]> {
    const { data: certs, error: certError } = await supabase
      .from('Certificate')
      .select('*')
      .eq('userId', userId)
      .order('issuedAt', { ascending: false });

    if (certError) {
      throw new Error(`Database error: ${certError.message}`);
    }

    if (!certs || certs.length === 0) return [];

    // Fetch all courses referenced in certificates
    const courseIds = Array.from(new Set(certs.map(c => c.courseId)));
    const { data: courses, error: courseError } = await supabase
      .from('Course')
      .select('*')
      .in('id', courseIds);

    if (courseError) {
      throw new Error(`Database error: ${courseError.message}`);
    }

    // Fetch all instructors referenced in courses
    const instructorIds = Array.from(new Set(courses?.map(c => c.instructorId).filter(Boolean) || []));
    let instructors: any[] = [];
    if (instructorIds.length > 0) {
      const { data: insts, error: instError } = await supabase
        .from('User')
        .select('id, fullName, email')
        .in('id', instructorIds);
      if (instError) {
        throw new Error(`Database error: ${instError.message}`);
      }
      instructors = insts || [];
    }

    // Fetch Student User details
    const { data: student, error: studentError } = await supabase
      .from('User')
      .select('id, fullName, email')
      .eq('id', userId)
      .maybeSingle();

    if (studentError) {
      throw new Error(`Database error: ${studentError.message}`);
    }

    return certs.map(cert => {
      const course = courses?.find(c => c.id === cert.courseId);
      const instructor = instructors.find(i => i.id === course?.instructorId);
      return {
        ...cert,
        course: course ? {
          ...course,
          instructor: instructor || undefined
        } : undefined,
        user: student || undefined
      };
    });
  }

  /**
   * Issue a new certificate
   */
  async create(userId: string, courseId: string): Promise<Certificate> {
    const existing = await this.findByUserAndCourse(userId, courseId);
    if (existing) return existing;

    const id = crypto.randomUUID();
    const certificateCode = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const insertData = {
      id,
      userId,
      courseId,
      certificateCode,
      issuedAt: now,
    };

    const { error } = await supabase
      .from('Certificate')
      .insert(insertData);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const cert = await this.findByUserAndCourse(userId, courseId);
    if (!cert) {
      throw new Error(`Failed to retrieve newly created certificate.`);
    }
    return cert;
  }
}

export const certificateRepository = new CertificateRepository();
export default certificateRepository;
