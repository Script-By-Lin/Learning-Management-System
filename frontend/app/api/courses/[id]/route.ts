import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { courseController } from '@backend/api/controllers/CourseController';
import { Role } from '@backend/shared/constants/roles';

export const dynamic = 'force-dynamic';


interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const result = await courseController.getCourseSyllabus(id);
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.INSTRUCTOR, Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const result = await courseController.updateCourse(
      id,
      body,
      auth.user.userId,
      auth.user.role as Role
    );

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.INSTRUCTOR, Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const result = await courseController.deleteCourse(
      id,
      auth.user.userId,
      auth.user.role as Role
    );

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
