import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { paymentController } from '@backend/api/controllers/PaymentController';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user as ADMIN
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Fetch list of payments
    const result = await paymentController.listPayments();
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred while listing payments.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // 1. Authenticate user as ADMIN
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Read request body
    const body = await request.json();
    const { paymentId, status } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { success: false, data: null, error: 'Payment ID and status are required.' },
        { status: 400 }
      );
    }

    // 3. Process approval or rejection via controller
    const result = await paymentController.reviewPayment(paymentId, { status });
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred while reviewing the payment.' },
      { status: 500 }
    );
  }
}
