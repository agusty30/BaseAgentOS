import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../security/auth.js';

describe('password hashing (Argon2id)', () => {
  it('hashes and verifies a password', async () => {
    const password = 'MyS3cur3P@ssw0rd!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('correct-password');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('produces different hashes for same password (random salt)', async () => {
    const password = 'same-password';
    const a = await hashPassword(password);
    const b = await hashPassword(password);
    expect(a).not.toBe(b);
  });

  it('returns false for invalid hash format', async () => {
    expect(await verifyPassword('test', 'not-a-real-hash')).toBe(false);
  });
});
