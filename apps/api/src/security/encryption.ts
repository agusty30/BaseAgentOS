import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

function getMasterKey(): Buffer {
  const key = process.env.ENCRYPTION_MASTER_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set');
  }
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be a 32-byte hex-encoded string (64 hex characters)');
  }
  return keyBuffer;
}

function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
}

export function encrypt(plaintext: string): string {
  const masterKey = getMasterKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = deriveKey(masterKey, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: salt(32) + iv(16) + authTag(16) + ciphertext
  const result = Buffer.concat([salt, iv, authTag, encrypted]);
  return result.toString('base64');
}

export function decrypt(encryptedData: string): string {
  const masterKey = getMasterKey();
  const data = Buffer.from(encryptedData, 'base64');

  if (data.length < SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('Invalid encrypted data: too short');
  }

  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const derivedKey = deriveKey(masterKey, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
