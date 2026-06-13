import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { newsletterController } from '@backend/api/controllers/NewsletterController';
import { Role } from '@backend/shared/constants/roles';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const result = await newsletterController.broadcastNewsletter(body, auth.user.role as Role);
    
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
