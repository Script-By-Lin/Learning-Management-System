import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { userRepository } from '@backend/repositories/UserRepository';
import { Role } from '@backend/shared/constants/roles';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateAndAuthorize(request, [Role.STUDENT, Role.INSTRUCTOR, Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const allUsers = await userRepository.findAll();

    // Filter recipients based on role
    let recipients: typeof allUsers = [];
    if (auth.user.role === Role.STUDENT) {
      // Students can only message Instructors
      recipients = allUsers.filter((u) => u.role === Role.INSTRUCTOR);
    } else if (auth.user.role === Role.INSTRUCTOR) {
      // Instructors can message Admins and Students
      recipients = allUsers.filter((u) => u.role === Role.ADMIN || u.role === Role.STUDENT);
    } else if (auth.user.role === Role.ADMIN) {
      // Admins can only message Instructors
      recipients = allUsers.filter((u) => u.role === Role.INSTRUCTOR);
    }

    // Strip password hashes
    const safeRecipients = recipients.map(({ passwordHash, ...user }) => user);

    return NextResponse.json({
      success: true,
      data: safeRecipients,
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message || 'An error occurred.' },
      { status: 500 }
    );
  }
}
