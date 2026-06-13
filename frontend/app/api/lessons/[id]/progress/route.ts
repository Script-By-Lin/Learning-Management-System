import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { progressController } from '@backend/api/controllers/ProgressController';
import { Role } from '@backend/shared/constants/roles';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: lessonId } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const result = await progressController.getLessonCompletion(auth.user.userId, lessonId);
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
    const { id: lessonId } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.STUDENT]);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const result = await progressController.toggleLessonProgress(auth.user.userId, lessonId, body);
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
