import { NextResponse } from 'next/server';
import { authController } from '@backend/api/controllers/AuthController';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await authController.register(body);

    if (!result.success || !result.data || !result.data.token) {
      return NextResponse.json(result, { status: 400 });
    }

    const response = NextResponse.json(result);
    
    // Store JWT token securely in HTTP-only cookie
    response.cookies.set('lms_token', result.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred during registration.',
      },
      { status: 500 }
    );
  }
}
