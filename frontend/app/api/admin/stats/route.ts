import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { supabase } from '@backend/core/config/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize as Admin
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Fetch counts from Supabase database
    const [coursesRes, lessonsRes, enrollmentsRes, studentsRes] = await Promise.all([
      supabase.from('Course').select('*', { count: 'exact', head: true }),
      supabase.from('Lesson').select('*', { count: 'exact', head: true }),
      supabase.from('Enrollment').select('*', { count: 'exact', head: true }),
      supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', Role.STUDENT),
    ]);

    if (coursesRes.error) throw new Error(`Courses count error: ${coursesRes.error.message}`);
    if (lessonsRes.error) throw new Error(`Lessons count error: ${lessonsRes.error.message}`);
    if (enrollmentsRes.error) throw new Error(`Enrollments count error: ${enrollmentsRes.error.message}`);
    if (studentsRes.error) throw new Error(`Students count error: ${studentsRes.error.message}`);

    const coursesCount = coursesRes.count || 0;
    const lessonsCount = lessonsRes.count || 0;
    const enrollmentsCount = enrollmentsRes.count || 0;
    const studentsCount = studentsRes.count || 0;

    // 3. Simulated monthly revenue data matching the screenshot (March peak)
    const revenueData = [
      { month: 'January', revenue: 0 },
      { month: 'February', revenue: 0 },
      { month: 'March', revenue: 3500 }, // Peak as shown in the screenshot
      { month: 'April', revenue: 0 },
      { month: 'May', revenue: 0 },
      { month: 'June', revenue: 0 },
      { month: 'July', revenue: 0 },
      { month: 'August', revenue: 0 },
      { month: 'September', revenue: 0 },
      { month: 'October', revenue: 0 },
      { month: 'November', revenue: 0 },
      { month: 'December', revenue: 0 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          coursesCount,
          lessonsCount,
          enrollmentsCount,
          studentsCount,
        },
        revenue: revenueData,
      },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while fetching dashboard statistics.',
      },
      { status: 500 }
    );
  }
}
