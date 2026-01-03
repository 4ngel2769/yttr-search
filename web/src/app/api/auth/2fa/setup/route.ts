import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generateTwoFactorSecret,
  generateQRCode,
  generateBackupCodes,
  hashBackupCodes,
} from '@/lib/two-factor';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate 2FA secret
    const secret = generateTwoFactorSecret();
    const qrCodeDataUrl = await generateQRCode(session.user.email, secret);
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Store secret in database (not yet enabled)
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        twoFactorSecret: secret,
        backupCodes: hashedBackupCodes,
        // Don't enable 2FA until user verifies token
      },
    });

    return NextResponse.json({
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup two-factor authentication' },
      { status: 500 }
    );
  }
}
