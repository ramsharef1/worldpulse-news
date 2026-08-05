import crypto from 'crypto';

// ============================================
// ENCRYPTION UTILITIES - AES-256-GCM
// ============================================

/**
 * Encryption configuration
 */
export const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  saltLength: 32, // 256 bits
  tagLength: 16, // 128 bits
  iterations: 100000, // for PBKDF2
};

/**
 * Generate a random encryption key
 */
export function generateEncryptionKey(): Buffer {
  return crypto.randomBytes(ENCRYPTION_CONFIG.keyLength);
}

/**
 * Derive a key from a password using PBKDF2
 */
export function deriveKeyFromPassword(
  password: string,
  salt?: Buffer
): { key: Buffer; salt: Buffer } {
  const derivedSalt = salt || crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);

  const key = crypto.pbkdf2Sync(
    password,
    derivedSalt,
    ENCRYPTION_CONFIG.iterations,
    ENCRYPTION_CONFIG.keyLength,
    'sha256'
  );

  return { key, salt: derivedSalt };
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptData(
  data: string | Buffer,
  key: Buffer,
  additionalData?: string
): {
  encrypted: string;
  iv: string;
  tag: string;
  salt?: string;
  algorithm: string;
} {
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

  const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);

  // Add additional authenticated data if provided
  if (additionalData) {
    cipher.setAAD(Buffer.from(additionalData, 'utf-8'));
  }

  let encrypted = cipher.update(dataBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    algorithm: ENCRYPTION_CONFIG.algorithm,
  };
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptData(
  encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
    algorithm: string;
  },
  key: Buffer,
  additionalData?: string
): string {
  try {
    const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');

    const decipher = crypto.createDecipheriv(
      ENCRYPTION_CONFIG.algorithm,
      key,
      iv
    );

    decipher.setAuthTag(tag);

    // Set additional authenticated data if provided
    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData, 'utf-8'));
    }

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf-8');
  } catch (error) {
    throw new Error(`Decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Encrypt data with a password
 */
export function encryptWithPassword(
  data: string | Buffer,
  password: string
): {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
  algorithm: string;
} {
  const { key, salt } = deriveKeyFromPassword(password);
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

  const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

  const cipher = crypto.createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv);

  let encrypted = cipher.update(dataBuffer);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    salt: salt.toString('hex'),
    algorithm: ENCRYPTION_CONFIG.algorithm,
  };
}

/**
 * Decrypt data with a password
 */
export function decryptWithPassword(
  encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
    salt: string;
    algorithm: string;
  },
  password: string
): string {
  try {
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const { key } = deriveKeyFromPassword(password, salt);

    const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');

    const decipher = crypto.createDecipheriv(
      ENCRYPTION_CONFIG.algorithm,
      key,
      iv
    );

    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf-8');
  } catch (error) {
    throw new Error(`Decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Hash data using SHA-256
 */
export function hashData(data: string | Buffer, salt?: Buffer): string {
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  const hash = crypto.createHash('sha256');

  if (salt) {
    hash.update(salt);
  }

  hash.update(dataBuffer);
  return hash.digest('hex');
}

/**
 * Generate a checksum for data integrity verification
 */
export function generateChecksum(data: Buffer | string): string {
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  return crypto.createHash('sha256').update(dataBuffer).digest('hex');
}

/**
 * Verify a checksum
 */
export function verifyChecksum(
  data: Buffer | string,
  checksum: string
): boolean {
  const computedChecksum = generateChecksum(data);
  return crypto.timingSafeEqual(
    Buffer.from(computedChecksum),
    Buffer.from(checksum)
  );
}

/**
 * Generate a random token for secure operations
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt JSON data (serializes to string first)
 */
export function encryptJSON(
  data: Record<string, any>,
  key: Buffer
): {
  encrypted: string;
  iv: string;
  tag: string;
  algorithm: string;
} {
  const jsonString = JSON.stringify(data);
  return encryptData(jsonString, key);
}

/**
 * Decrypt JSON data (parses from string)
 */
export function decryptJSON(
  encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
    algorithm: string;
  },
  key: Buffer
): Record<string, any> {
  const decryptedString = decryptData(encryptedData, key);
  return JSON.parse(decryptedString);
}

/**
 * Create an HMAC for message authentication
 */
export function createHMAC(
  data: string | Buffer,
  key: Buffer
): string {
  const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
  return crypto.createHmac('sha256', key).update(dataBuffer).digest('hex');
}

/**
 * Verify an HMAC
 */
export function verifyHMAC(
  data: string | Buffer,
  key: Buffer,
  hmac: string
): boolean {
  const computedHMAC = createHMAC(data, key);
  return crypto.timingSafeEqual(
    Buffer.from(computedHMAC),
    Buffer.from(hmac)
  );
}

/**
 * Secure password hashing using bcrypt algorithm
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    ENCRYPTION_CONFIG.iterations,
    ENCRYPTION_CONFIG.keyLength,
    'sha256'
  );

  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a password hash
 */
export function verifyPasswordHash(password: string, hash: string): boolean {
  try {
    const [saltHex, hashHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');

    const computedHash = crypto.pbkdf2Sync(
      password,
      salt,
      ENCRYPTION_CONFIG.iterations,
      ENCRYPTION_CONFIG.keyLength,
      'sha256'
    );

    return crypto.timingSafeEqual(
      Buffer.from(hashHex, 'hex'),
      computedHash
    );
  } catch (error) {
    return false;
  }
}

/**
 * Rotate an encryption key
 */
export function rotateKey(oldData: any, oldKey: Buffer, newKey: Buffer): any {
  try {
    if (typeof oldData === 'string') {
      // Simple string
      const decrypted = decryptData(JSON.parse(oldData), oldKey);
      return encryptData(decrypted, newKey);
    } else if (oldData.encrypted) {
      // Already encrypted data
      const decrypted = decryptData(oldData, oldKey);
      return encryptData(decrypted, newKey);
    } else {
      // Plain data
      return encryptData(JSON.stringify(oldData), newKey);
    }
  } catch (error) {
    throw new Error(`Key rotation failed: ${(error as Error).message}`);
  }
}

export default {
  generateEncryptionKey,
  deriveKeyFromPassword,
  encryptData,
  decryptData,
  encryptWithPassword,
  decryptWithPassword,
  hashData,
  generateChecksum,
  verifyChecksum,
  generateSecureToken,
  encryptJSON,
  decryptJSON,
  createHMAC,
  verifyHMAC,
  hashPassword,
  verifyPasswordHash,
  rotateKey,
};
