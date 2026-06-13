import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { userRepository } from '@backend/repositories/UserRepository';
import { Role } from '@backend/shared/constants/roles';

export async function PUT(request: NextRequest) {
  try {
    // 1. Authenticate and authorize as Admin
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Parse request body
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'User ID and role are required.',
        },
        { status: 400 }
      );
    }

    // 3. Validate role
    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: `Invalid role. Allowed values: ${Object.values(Role).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // 4. Check if admin is trying to demote themselves (optional but recommended safety check)
    if (userId === auth.user.userId && role !== Role.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Administrators cannot demote themselves.',
        },
        { status: 400 }
      );
    }

    // 5. Check if target user exists
    const targetUser = await userRepository.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Target user not found.',
        },
        { status: 404 }
      );
    }

    // 6. Update user role
    const updatedUser = await userRepository.update(userId, {
      role: role as Role,
    });

    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      data: { user: safeUser },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while updating user role.',
      },
      { status: 500 }
    );
  }
}
