import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { userRepository } from '@backend/repositories/UserRepository';
import { Role } from '@backend/shared/constants/roles';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize as Admin
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Fetch all users from database
    const users = await userRepository.findAll();

    // 3. Remove sensitive password hashes before returning
    const safeUsers = users.map(({ passwordHash, ...user }) => user);

    return NextResponse.json({
      success: true,
      data: { users: safeUsers },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while fetching users.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Authenticate and authorize as Admin
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Parse request query param
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, data: null, error: 'User ID is required.' },
        { status: 400 }
      );
    }

    // Avoid self-deletion
    if (userId === auth.user.userId) {
      return NextResponse.json(
        { success: false, data: null, error: 'You cannot delete your own administrator account.' },
        { status: 400 }
      );
    }

    // 3. Delete user
    const deletedUser = await userRepository.delete(userId);

    return NextResponse.json({
      success: true,
      data: { user: deletedUser },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while deleting user.',
      },
      { status: 500 }
    );
  }
}
