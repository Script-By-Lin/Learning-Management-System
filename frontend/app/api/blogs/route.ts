import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { blogController } from '@backend/api/controllers/BlogController';
import { Role } from '@backend/shared/constants/roles';

export async function GET(request: NextRequest) {
  try {
    const result = await blogController.listBlogs();
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

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();
    const result = await blogController.createBlog(body, auth.user.role as Role);
    
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
