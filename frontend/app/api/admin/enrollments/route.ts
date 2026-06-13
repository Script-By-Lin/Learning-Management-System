import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { Role } from '@backend/shared/constants/roles';
import { supabase } from '@backend/core/config/supabase';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize as Admin
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    // 2. Fetch all enrollments with student profile details and course titles
    const { data, error } = await supabase
      .from('Enrollment')
      .select('*, user:User(fullName, email), course:Course(title)')
      .order('joinedAt', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: { enrollments: data || [] },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while fetching enrollments.',
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

    // 2. Parse enrollment ID from search query
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Missing required query parameter "id".',
        },
        { status: 400 }
      );
    }

    // 3. Delete the enrollment record
    const { data, error } = await supabase
      .from('Enrollment')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: { deletedEnrollment: data },
      error: null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'An error occurred while revoking enrollment.',
      },
      { status: 500 }
    );
  }
}
