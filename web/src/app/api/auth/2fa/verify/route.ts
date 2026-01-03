import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyTwoFactorToken } from '@/lib/two-factor';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get user's secret
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { twoFactorSecret: true },
    });

    if (!user?.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Two-factor authentication is not set up' },
        { status: 400 }
      );
    }

    // Verify token
    const isValid = verifyTwoFactorToken(token, user.twoFactorSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Enable 2FA
    await prisma.user.update({
      where: { email: session.user.email },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Failed to verify two-factor authentication' },
      { status: 500 }
    );
  }
}
