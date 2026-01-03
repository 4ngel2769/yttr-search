'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MagicLinkLoginProps {
  isAvailable: boolean;
}

export default function MagicLinkLogin({ isAvailable }: MagicLinkLoginProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isAvailable) {
    return null;
  }

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send magic link');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link. Please try password login instead.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Alert className="mt-4">
        <AlertDescription>
          ✉️ Check your email! We&apos;ve sent you a magic link to sign in.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or</span>
        </div>
      </div>

      <form onSubmit={handleSendMagicLink} className="mt-6">
        <div className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={loading || !email}
          >
            {loading ? 'Sending...' : '🔗 Sign in with Magic Link'}
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            We&apos;ll send you a secure link to sign in without a password
          </p>
        </div>
      </form>
    </div>
  );
}
