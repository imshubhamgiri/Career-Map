import argon2 from 'argon2';
import crypto from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

// Opaque random string generator for refresh tokens
export function generateOpaqueToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

// SHA-256 hash to secure token storage in PostgreSQL
export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// SHA-256 hash for API keys (api_keys.key_hash)
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey.trim()).digest('hex');
}

const AES_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

function getEncryptionKeyBuffer(): Buffer {
  const rawSecret =
    process.env.ENCRYPTION_KEY ||
    process.env.ACCESS_TOKEN_SECRET ||
    'cos-default-dev-encryption-key-do-not-use-in-prod';

  // If a 64-char hex string (32 bytes) is provided, use it directly; otherwise derive 32 bytes via SHA-256
  if (/^[0-9a-fA-F]{64}$/.test(rawSecret)) {
    return Buffer.from(rawSecret, 'hex');
  }
  return crypto.createHash('sha256').update(rawSecret).digest();
}

/**
 * Encrypts sensitive strings (such as GitHub Personal Access Tokens) using AES-256-GCM.
 * Format: `${ivHex}:${authTagHex}:${encryptedHex}`
 */
export function encryptSecret(plainText: string): string {
  const key = getEncryptionKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(AES_ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload produced by `encryptSecret`.
 */
export function decryptSecret(cipherText: string): string {
  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKeyBuffer();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(AES_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

