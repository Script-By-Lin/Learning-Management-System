import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '../core/security/security';
import { Role } from '../shared/constants/roles';
import { Logger } from '../core/utils/logger';

export interface AuthenticatedRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Extracts and verifies JWT from NextRequest.
 * Returns the token payload if valid, otherwise returns null.
 */
export function authenticate(request: NextRequest): TokenPayload | null {
  try {
    let token = '';

    // 1. Try to get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. If no header, try to get from lms_token cookie
    if (!token) {
      const tokenCookie = request.cookies.get('lms_token');
      if (tokenCookie) {
        token = tokenCookie.value;
      }
    }

    if (!token) {
      return null;
    }

    // Verify token
    const decoded = verifyToken(token);
    return decoded;
  } catch (error: any) {
    Logger.error(`Token verification failed for path: ${request.nextUrl.pathname}`, error);
    return null;
  }
}

/**
 * Helper to check if user has required roles
 */
export function authorize(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Route guard helper that combines authentication and authorization.
 * Returns { authorized: true, user } if verified, or { authorized: false, response } with 401/403.
 */
export function authenticateAndAuthorize(
  request: NextRequest,
  allowedRoles?: Role[]
): { authorized: false; response: NextResponse } | { authorized: true; user: TokenPayload } {
  const method = request.method;
  const path = request.nextUrl.pathname;

  const user = authenticate(request);
  if (!user) {
    Logger.warn(`Access Denied (401 - Unauthorized): ${method} ${path}`);
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, data: null, error: 'Unauthorized. Please login.' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !authorize(user.role as Role, allowedRoles)) {
    Logger.warn(`Access Denied (403 - Forbidden): ${method} ${path} | User: ${user.email} | Role: ${user.role} | Required: ${allowedRoles.join(', ')}`);
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, data: null, error: 'Forbidden. Insufficient permissions.' },
        { status: 403 }
      ),
    };
  }

  Logger.info(`Access Granted: ${method} ${path} | User: ${user.email} (${user.role})`);
  return { authorized: true, user };
}


