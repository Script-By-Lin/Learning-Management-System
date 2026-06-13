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
    const { userId, isApproved } = body;

    if (!userId || isApproved === undefined) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'User ID and isApproved flag are required.',
        },
        { status: 400 }
      );
    }

    // 3. Check if target user exists
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

    // 4. Update user approval status
    const updatedUser = await userRepository.update(userId, {
      isApproved: !!isApproved,
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
        error: error.message || 'An error occurred while updating user approval status.',
      },
      { status: 500 }
    );
  }
}
