import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const MAGIC_LINK_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * Check if email verification is enabled
 */
export function isEmailVerificationEnabled(): boolean {
  return process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
}

/**
 * Generate a magic link token
 */
export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const magicLink = `${appUrl}/auth/magic-link?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔐 Sign in to ${process.env.NEXT_PUBLIC_APP_NAME || 'YTTR Search'}</h2>
          <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
          <a href="${magicLink}" class="button">Sign In</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0070f3;">${magicLink}</p>
          <p>If you didn't request this email, you can safely ignore it.</p>
          <div class="footer">
            <p>This is an automated email from ${process.env.NEXT_PUBLIC_APP_NAME || 'YTTR Search'}. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: `Sign in to ${process.env.NEXT_PUBLIC_APP_NAME || 'YTTR Search'}`,
    html,
  });
}

/**
 * Create magic link token in database
 */
export async function createMagicLinkToken(email: string): Promise<string> {
  const token = generateMagicLinkToken();
  const expires = new Date(Date.now() + MAGIC_LINK_EXPIRY);

  // Store in verification token table (reuse existing table)
  await prisma.verificationToken.create({
    data: {
      identifier: `magic:${email}`,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Verify magic link token
 */
export async function verifyMagicLinkToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return { success: false, error: 'Invalid or expired magic link' };
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return { success: false, error: 'Magic link has expired' };
    }

    // Extract email from identifier
    const email = verificationToken.identifier.replace('magic:', '');

    // Delete the token (one-time use)
    await prisma.verificationToken.delete({
      where: { token },
    });

    return { success: true, email };
  } catch (error) {
    console.error('Magic link verification error:', error);
    return { success: false, error: 'Failed to verify magic link' };
  }
}

/**
 * Send password reset with fallback options
 */
export async function sendPasswordResetOptions(email: string): Promise<{
  success: boolean;
  methods: ('email' | 'magic-link')[];
  error?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists
    return { success: true, methods: [] };
  }

  const methods: ('email' | 'magic-link')[] = [];
  const errors: string[] = [];

  // Try traditional email reset
  try {
    const { sendPasswordResetEmail } = await import('@/lib/email');
    const token = generateMagicLinkToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires,
      },
    });

    await sendPasswordResetEmail(email, token);
    methods.push('email');
  } catch (error) {
    console.error('Email reset error:', error);
    errors.push('email failed');
  }

  // If email verification is enabled, offer magic link
  if (isEmailVerificationEnabled() && user.emailVerified) {
    try {
      const token = await createMagicLinkToken(email);
      await sendMagicLinkEmail(email, token);
      methods.push('magic-link');
    } catch (error) {
      console.error('Magic link error:', error);
      errors.push('magic link failed');
    }
  }

  return {
    success: methods.length > 0,
    methods,
    error: methods.length === 0 ? 'Failed to send reset options. Please contact support.' : undefined,
  };
}
