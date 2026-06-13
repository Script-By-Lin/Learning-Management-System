import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { assessmentController } from '@backend/api/controllers/AssessmentController';
import { Role } from '@backend/shared/constants/roles';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: assignmentId } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.STUDENT]);
    if (!auth.authorized) {
      return auth.response;
    }

    const result = await assessmentController.getStudentAssignmentSubmission(
      assignmentId,
      auth.user.userId
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

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: assignmentId } = await context.params;
    const auth = authenticateAndAuthorize(request, [Role.STUDENT]);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const result = await assessmentController.submitAssignment(
      assignmentId,
      auth.user.userId,
      body
    );

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
