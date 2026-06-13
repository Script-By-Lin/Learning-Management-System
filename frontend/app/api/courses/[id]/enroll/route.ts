import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { courseController } from '@backend/api/controllers/CourseController';
import { Role } from '@backend/shared/constants/roles';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: courseId } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.STUDENT]);
    if (!auth.authorized) {
      return auth.response;
    }

    const result = await courseController.checkEnrollmentStatus(auth.user.userId, courseId);
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

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: courseId } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.STUDENT]);
    if (!auth.authorized) {
      return auth.response;
    }

    const result = await courseController.enrollStudent(auth.user.userId, courseId);
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
