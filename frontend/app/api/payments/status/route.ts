import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { paymentController } from '@backend/api/controllers/PaymentController';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user as STUDENT
    const auth = authenticateAndAuthorize(request, [Role.STUDENT]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Read courseId query param
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { success: false, data: null, error: 'Course ID is required.' },
        { status: 400 }
      );
    }

    // 3. Query payment details
    const result = await paymentController.checkPaymentStatus(auth.user.userId, courseId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred while fetching payment status.' },
      { status: 500 }
    );
  }
}
