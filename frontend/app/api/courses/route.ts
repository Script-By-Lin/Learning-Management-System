import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { courseController } from '@backend/api/controllers/CourseController';
import { Role } from '@backend/shared/constants/roles';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  const result = await courseController.listCourses();
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAndAuthorize(request, [Role.INSTRUCTOR, Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const result = await courseController.createCourse(body, auth.user.userId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred.' },
      { status: 500 }
    );
  }
}
