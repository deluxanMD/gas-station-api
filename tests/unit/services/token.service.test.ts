import jwt from 'jsonwebtoken';
import { UserRole } from '@/constants/role.constants';
import { env } from '@/config/env';
import { signAccessToken, verifyAccessToken } from '@/services/token.service';

const SECRET = 'test-secret-that-is-at-least-32-characters';

jest.mock('@/config/env', () => ({
  env: { JWT_SECRET: 'test-secret-that-is-at-least-32-characters', JWT_EXPIRES_IN: '1h' },
}));

describe('signAccessToken', () => {
  it('encodes the user id as subject and the role as a claim', () => {
    const token = signAccessToken({ userId: 'alice', userRole: UserRole.Manager });
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;

    expect(payload.sub).toBe('alice');
    expect(payload.role).toBe(UserRole.Manager);
    expect(payload.exp).toEqual(expect.any(Number));
  });

  it('throws when JWT_SECRET is not configured', () => {
    const mutableEnv = env as { JWT_SECRET?: string };
    mutableEnv.JWT_SECRET = undefined;

    expect(() => signAccessToken({ userId: 'alice', userRole: null })).toThrow('JWT_SECRET');

    mutableEnv.JWT_SECRET = SECRET;
  });
});

describe('verifyAccessToken', () => {
  it('returns the user id and role from a token it signed', () => {
    const token = signAccessToken({ userId: 'alice', userRole: UserRole.Manager });

    expect(verifyAccessToken(token)).toEqual({ userId: 'alice', userRole: UserRole.Manager });
  });

  it('returns a null role when the token carries none', () => {
    const token = signAccessToken({ userId: 'bob', userRole: null });

    expect(verifyAccessToken(token)).toEqual({ userId: 'bob', userRole: null });
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({ role: 'OWNER' }, 'another-secret-that-is-32-characters-long', {
      subject: 'mallory',
    });

    expect(() => verifyAccessToken(forged)).toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ role: UserRole.Manager }, SECRET, {
      subject: 'alice',
      expiresIn: -10,
    });

    expect(() => verifyAccessToken(expired)).toThrow(expect.objectContaining({ statusCode: 401 }));
  });

  it('rejects a malformed token', () => {
    expect(() => verifyAccessToken('not.a.jwt')).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('rejects a token without a subject', () => {
    const noSubject = jwt.sign({ role: UserRole.Manager }, SECRET);

    expect(() => verifyAccessToken(noSubject)).toThrow(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});
