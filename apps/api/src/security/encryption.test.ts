import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { encrypt, decrypt, generateEncryptionKey } from '../security/encryption.js';

const TEST_KEY = 'a'.repeat(64);

beforeAll(() => {
  process.env.ENCRYPTION_MASTER_KEY = TEST_KEY;
});

afterAll(() => {
  delete process.env.ENCRYPTION_MASTER_KEY;
});

describe('encrypt / decrypt', () => {
  it('round-trips a plaintext string', () => {
    const plaintext = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it('produces different ciphertext each time (random salt+iv)', () => {
    const plaintext = 'test-private-key';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(plaintext);
    expect(decrypt(b)).toBe(plaintext);
  });

  it('rejects empty plaintext on decrypt (ciphertext too short)', () => {
    const encrypted = encrypt('');
    expect(() => decrypt(encrypted)).toThrow('too short');
  });

  it('handles unicode content', () => {
    const plaintext = 'hello 🔑 world 日本語';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it('handles long content', () => {
    const plaintext = 'x'.repeat(10000);
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it('throws on tampered ciphertext', () => {
    const encrypted = encrypt('secret');
    const buf = Buffer.from(encrypted, 'base64');
    buf[buf.length - 1] ^= 0xff;
    const tampered = buf.toString('base64');
    expect(() => decrypt(tampered)).toThrow();
  });

  it('throws on truncated data', () => {
    expect(() => decrypt(Buffer.from('short').toString('base64'))).toThrow('too short');
  });
});

describe('generateEncryptionKey', () => {
  it('returns a 64-character hex string', () => {
    const key = generateEncryptionKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique keys', () => {
    const a = generateEncryptionKey();
    const b = generateEncryptionKey();
    expect(a).not.toBe(b);
  });
});

describe('getMasterKey validation', () => {
  it('throws when ENCRYPTION_MASTER_KEY is not set', () => {
    const saved = process.env.ENCRYPTION_MASTER_KEY;
    delete process.env.ENCRYPTION_MASTER_KEY;
    expect(() => encrypt('test')).toThrow('ENCRYPTION_MASTER_KEY environment variable is not set');
    process.env.ENCRYPTION_MASTER_KEY = saved;
  });

  it('throws when key is wrong length', () => {
    const saved = process.env.ENCRYPTION_MASTER_KEY;
    process.env.ENCRYPTION_MASTER_KEY = 'abcd';
    expect(() => encrypt('test')).toThrow('32-byte');
    process.env.ENCRYPTION_MASTER_KEY = saved;
  });
});
