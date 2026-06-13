import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { watchController } from '@backend/api/controllers/WatchController';
import { Role } from '@backend/shared/constants/roles';

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { courseId } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const result = await watchController.getCourseWatchStats(auth.user.userId, courseId);

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
