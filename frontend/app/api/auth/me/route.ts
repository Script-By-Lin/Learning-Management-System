import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@backend/middleware/authMiddleware';
import { authController } from '@backend/api/controllers/AuthController';
import { userRepository } from '@backend/repositories/UserRepository';

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    // Run authentication middleware
    const userPayload = authenticate(request);

    if (!userPayload) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Unauthorized. Please login.',
        },
        { status: 401 }
      );
    }

    const result = await authController.me(userPayload.userId);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while fetching user data.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userPayload = authenticate(request);
    if (!userPayload) {
      return NextResponse.json(
        { success: false, data: null, error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, bio, avatarUrl } = body;

    const updatedUser = await userRepository.update(userPayload.userId, {
      fullName,
      bio,
      avatarUrl,
    });

    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      data: { user: safeUser },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred while updating profile.' },
      { status: 500 }
    );
  }
}
