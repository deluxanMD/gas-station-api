import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { ROLE_CODES, type RoleCode } from '@/db/schema/roles';
import type { AuthenticatedUser } from '@/types/auth.types';
import { httpError } from '@/utils/httpError';

const getSecret = (): string => {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return env.JWT_SECRET;
};

const isRoleCode = (value: unknown): value is RoleCode =>
  typeof value === 'string' && (ROLE_CODES as string[]).includes(value);

export const signAccessToken = ({ userId, userRole }: AuthenticatedUser): string =>
  jwt.sign({ role: userRole }, getSecret(), {
    subject: userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

// Throws a 401 for any token that is malformed, tampered with, expired or missing claims.
export const verifyAccessToken = (token: string): AuthenticatedUser => {
  const secret = getSecret();

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    throw httpError(401, 'Invalid or expired token');
  }

  if (typeof payload === 'string' || typeof payload.sub !== 'string') {
    throw httpError(401, 'Invalid or expired token');
  }

  return { userId: payload.sub, userRole: isRoleCode(payload.role) ? payload.role : null };
};
