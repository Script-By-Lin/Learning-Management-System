import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';

const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain password with a bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for the user
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
}

/**
 * Verify and decode a JWT token. Returns the payload or null if invalid.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
