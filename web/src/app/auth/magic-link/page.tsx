import { redirect } from 'next/navigation';
import { verifyMagicLinkToken } from '@/lib/magic-link';
import prisma from '@/lib/prisma';

export default async function MagicLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const { token } = params;

  if (!token) {
    redirect('/auth/login?error=invalid_magic_link');
  }

  const result = await verifyMagicLinkToken(token);

  if (!result.success || !result.email) {
    redirect(`/auth/login?error=${encodeURIComponent(result.error || 'invalid_magic_link')}`);
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { email: result.email },
  });

  if (!user) {
    redirect('/auth/login?error=user_not_found');
  }

  // In a real implementation, you'd create a session here
  // For now, redirect to login with a success message
  redirect(`/auth/login?email=${encodeURIComponent(result.email)}&magic_link_verified=true`);
}
