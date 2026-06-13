import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { authService } from '@backend/services/business/AuthService';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user as ADMIN
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Parse request body
    const body = await request.json();
    const { email, password, fullName, role } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, data: null, error: 'Email, password, full name, and role are required.' },
        { status: 400 }
      );
    }

    if (role !== Role.STUDENT && role !== Role.INSTRUCTOR) {
      return NextResponse.json(
        { success: false, data: null, error: 'Admin can only register Student or Instructor accounts.' },
        { status: 400 }
      );
    }

    // 3. Register user directly using authService
    const result = await authService.register({
      email,
      password,
      fullName,
      role: role as Role,
    });

    return NextResponse.json({
      success: true,
      data: { user: result.user },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred during account creation.' },
      { status: 500 }
    );
  }
}
