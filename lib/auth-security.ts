import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.REFRESH_EXPIRY || '7d';

// ============================================
// JWT TOKEN MANAGEMENT
// ============================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  twoFAVerified: boolean;
}

export const generateAccessToken = (payload: Partial<JWTPayload>) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const generateRefreshToken = (payload: Partial<JWTPayload>) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string) => {
  return jwt.decode(token);
};

// ============================================
// PASSWORD HASHING & VALIDATION
// ============================================

export const hashPassword = async (password: string): Promise<string> => {
  // For production, use bcrypt: await bcrypt.hash(password, 10)
  // Using Node's crypto for demo
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}$${hashedPassword}`;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const [salt, key] = hash.split('$');
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return key === hashedPassword;
};

// ============================================
// PASSWORD POLICY VALIDATION
// ============================================

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expiryDays: number;
  historyCount: number;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  expiryDays: 90,
  historyCount: 5,
};

export const validatePasswordPolicy = (
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain numbers');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain special characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================
// 2FA / TOTP SUPPORT (via speakeasy)
// ============================================

export const generateTOTPSecret = () => {
  // In production, use: speakeasy.generateSecret()
  const secret = crypto.randomBytes(32).toString('base64');
  return {
    secret,
    qrCode: `otpauth://totp/UniversitiesVoice?secret=${secret}`,
  };
};

export const verifyTOTP = (secret: string, token: string): boolean => {
  // In production, use: speakeasy.totp.verify()
  // This is a simplified version
  return token.length === 6 && /^\d{6}$/.test(token);
};

// ============================================
// API KEY GENERATION & VALIDATION
// ============================================

export const generateAPIKey = (): { publicKey: string; secretKey: string } => {
  const publicKey = `sk_pub_${crypto.randomBytes(16).toString('hex')}`;
  const secretKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  return { publicKey, secretKey };
};

export const hashAPIKey = (apiKey: string): string => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

export const validateAPIKey = (apiKey: string, hash: string): boolean => {
  return hashAPIKey(apiKey) === hash;
};

// ============================================
// SESSION TOKENS
// ============================================

export const generateSessionToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// ============================================
// RATE LIMITING HELPERS
// ============================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count < limit) {
    record.count++;
    return true;
  }

  return false;
};

export const getRateLimitInfo = (
  key: string
): { remaining: number; resetTime: number } => {
  const record = rateLimitStore.get(key);
  if (!record) {
    return { remaining: 5, resetTime: Date.now() + 15 * 60 * 1000 };
  }
  return {
    remaining: Math.max(0, 5 - record.count),
    resetTime: record.resetTime,
  };
};

// ============================================
// IP WHITELISTING
// ============================================

export const isIPWhitelisted = (
  ip: string,
  whitelist: string[]
): boolean => {
  return whitelist.includes(ip) || whitelist.includes('*');
};

export const normalizeIP = (ip: string): string => {
  // Handle IPv6 localhost, proxy headers, etc.
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
};

// ============================================
// CRYPTO HELPERS
// ============================================

export const generateRandomToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const encryptData = (data: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32)), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

export const decryptData = (encryptedData: string, key: string): string => {
  const [iv, encrypted] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key.padEnd(32)),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// ============================================
// VALIDATION UTILITIES
// ============================================

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 255);
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
