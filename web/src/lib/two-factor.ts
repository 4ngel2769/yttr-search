import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'YTTR Search';

/**
 * Generate a new 2FA secret for a user
 */
export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code data URL for 2FA setup
 */
export async function generateQRCode(email: string, secret: string): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, APP_NAME, secret);
  return await QRCode.toDataURL(otpauthUrl);
}

/**
 * Verify a 2FA token
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup codes for storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string> {
  const hashed = await Promise.all(
    codes.map(code => bcrypt.hash(code, 10))
  );
  return JSON.stringify(hashed);
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(code: string, hashedCodes: string): Promise<boolean> {
  try {
    const codes: string[] = JSON.parse(hashedCodes);
    for (const hashedCode of codes) {
      if (await bcrypt.compare(code, hashedCode)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Remove a used backup code
 */
export async function removeBackupCode(code: string, hashedCodes: string): Promise<string> {
  try {
    const codes: string[] = JSON.parse(hashedCodes);
    const remainingCodes: string[] = [];
    
    for (const hashedCode of codes) {
      if (!(await bcrypt.compare(code, hashedCode))) {
        remainingCodes.push(hashedCode);
      }
    }
    
    return JSON.stringify(remainingCodes);
  } catch (error) {
    return hashedCodes;
  }
}
