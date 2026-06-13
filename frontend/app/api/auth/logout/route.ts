import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      data: { message: 'Logged out successfully.' },
      error: null,
    });

    // Clear the HTTP-only cookie
    response.cookies.set('lms_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Immediately expires
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred during logout.',
      },
      { status: 500 }
    );
  }
}
