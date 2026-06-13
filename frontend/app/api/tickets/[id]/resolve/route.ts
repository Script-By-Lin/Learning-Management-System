import { NextRequest, NextResponse } from 'next/server';
import { authenticateAndAuthorize } from '@backend/middleware/authMiddleware';
import { ticketController } from '@backend/api/controllers/TicketController';
import { Role } from '@backend/shared/constants/roles';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = authenticateAndAuthorize(request, [Role.ADMIN]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await context.params;
    const body = await request.json();
    const resolved = body.resolved !== undefined ? !!body.resolved : true;

    const result = await ticketController.resolveTicket(id, resolved, auth.user.role as Role);

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
