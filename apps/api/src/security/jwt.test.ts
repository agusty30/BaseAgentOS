import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyRefreshToken } from '../security/auth.js';

describe('verifyRefreshToken', () => {
  const user = { id: 'u1', email: 'test@baseagent.io', role: 'admin' };
  const secret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

  it('decodes a valid token', () => {
    const token = jwt.sign(user, secret, { expiresIn: '7d' });
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe('u1');
    expect(decoded.email).toBe('test@baseagent.io');
    expect(decoded.role).toBe('admin');
  });

  it('throws on expired token', () => {
    const token = jwt.sign(user, secret, { expiresIn: '-1s' });
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('throws on token signed with wrong secret', () => {
    const token = jwt.sign(user, 'wrong-secret', { expiresIn: '7d' });
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('throws on malformed token', () => {
    expect(() => verifyRefreshToken('not.a.token')).toThrow();
  });
});
