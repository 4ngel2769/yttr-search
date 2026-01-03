import { NextResponse } from 'next/server';
import { isEmailVerificationEnabled, createMagicLinkToken, sendMagicLinkEmail } from '@/lib/magic-link';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email verification is enabled
    if (!isEmailVerificationEnabled()) {
      return NextResponse.json(
        { error: 'Magic link authentication is not available' },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    // Don't reveal if user exists - always return success
    if (user && user.emailVerified) {
      try {
        const token = await createMagicLinkToken(email);
        await sendMagicLinkEmail(email, token);
      } catch (error) {
        console.error('Magic link send error:', error);
        return NextResponse.json(
          { error: 'Failed to send magic link. Please try password reset instead.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'If an account exists with this email, a magic link has been sent.',
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
