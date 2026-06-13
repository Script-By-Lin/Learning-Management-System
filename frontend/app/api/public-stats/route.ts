import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@backend/core/config/supabase';
import { Role } from '@backend/shared/constants/roles';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Fetch counts from Supabase database (Active courses, Students, and Instructors)
    const [coursesRes, studentsRes, instructorsRes] = await Promise.all([
      supabase.from('Course').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', Role.STUDENT),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', Role.INSTRUCTOR),
    ]);

    if (coursesRes.error) throw new Error(`Courses count error: ${coursesRes.error.message}`);
    if (studentsRes.error) throw new Error(`Students count error: ${studentsRes.error.message}`);
    if (instructorsRes.error) throw new Error(`Instructors count error: ${instructorsRes.error.message}`);

    return NextResponse.json({
      success: true,
      data: {
        coursesCount: coursesRes.count || 0,
        studentsCount: studentsRes.count || 0,
        instructorsCount: instructorsRes.count || 0,
      },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while fetching public statistics.',
      },
      { status: 500 }
    );
  }
}
