import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'YTTR Search';
const fromEmail = process.env.EMAIL_FROM || 'noreply@yttr-search.com';

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: email,
    subject: `Verify your email - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; margin-bottom: 24px; font-size: 24px;">Welcome to ${appName}!</h1>
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Thanks for signing up. Please verify your email address by clicking the button below.
            </p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-bottom: 24px;">
              Verify Email
            </a>
            <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
            <p style="color: #71717a; font-size: 14px;">
              This link will expire in 24 hours.
            </p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
            <p style="color: #a1a1aa; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #3b82f6;">${verificationUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to ${appName}!\n\nPlease verify your email by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: email,
    subject: `Reset your password - ${appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; margin-bottom: 24px; font-size: 24px;">Reset Your Password</h1>
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-bottom: 24px;">
              Reset Password
            </a>
            <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
            <p style="color: #71717a; font-size: 14px;">
              This link will expire in 1 hour.
            </p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
            <p style="color: #a1a1aa; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Reset Your Password\n\nWe received a request to reset your password. Visit this link to create a new password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, you can safely ignore this email.`,
  });
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: `"${appName}" <${fromEmail}>`,
    to: email,
    subject: `Welcome to ${appName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome!</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #18181b; margin-bottom: 24px; font-size: 24px;">Welcome, ${name}!</h1>
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Your email has been verified and your account is now active. You can start searching YouTube transcripts right away!
            </p>
            <h2 style="color: #18181b; font-size: 18px; margin-top: 32px;">What you can do:</h2>
            <ul style="color: #52525b; font-size: 16px; line-height: 1.8;">
              <li>Search entire channels for keywords</li>
              <li>Search individual videos or playlists</li>
              <li>Upload batch files with multiple URLs</li>
              <li>Save videos and channels for later</li>
              <li>View your search history</li>
            </ul>
            <a href="${appUrl}/search" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 24px;">
              Start Searching
            </a>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
            <p style="color: #a1a1aa; font-size: 12px;">
              Need help? Contact us at support@yttr-search.com
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome, ${name}!\n\nYour email has been verified and your account is now active.\n\nStart searching: ${appUrl}/search\n\nNeed help? Contact us at support@yttr-search.com`,
  });
}

/**
 * Create verification token in database
 */
export async function createVerificationToken(identifier: string): Promise<string> {
  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Delete any existing tokens for this identifier
  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return token;
}

/**
 * Verify token and mark email as verified
 */
export async function verifyEmailToken(token: string): Promise<{ success: boolean; email?: string; error?: string }> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { success: false, error: 'Invalid or expired verification token' };
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { success: false, error: 'Verification token has expired' };
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  // Delete used token
  await prisma.verificationToken.delete({ where: { token } });

  return { success: true, email: verificationToken.identifier };
}
