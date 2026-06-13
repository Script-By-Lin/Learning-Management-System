import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { courseController } from '@backend/api/controllers/CourseController';
import { Role } from '@backend/shared/constants/roles';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAndAuthorize(request, [Role.STUDENT]);
    if (!auth.authorized) {
      return auth.response;
    }

    const result = await courseController.listStudentEnrolledCourses(auth.user.userId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred.' },
      { status: 500 }
    );
  }
}
