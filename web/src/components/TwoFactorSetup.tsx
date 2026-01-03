'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TwoFactorSetupProps {
  twoFactorEnabled: boolean;
}

export default function TwoFactorSetup({ twoFactorEnabled: initialEnabled }: TwoFactorSetupProps) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isSetup, setIsSetup] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to setup 2FA');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setIsSetup(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify code');
      }

      setIsEnabled(true);
      setSuccess('Two-factor authentication enabled successfully!');
      setIsSetup(false);
      setQrCode(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setIsEnabled(false);
      setSuccess('Two-factor authentication disabled successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isEnabled) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-gray-600 mb-4">
          Two-factor authentication is currently <strong>enabled</strong> for your account.
        </p>
        <Button
          onClick={handleDisable}
          variant="destructive"
          disabled={loading}
        >
          {loading ? 'Disabling...' : 'Disable 2FA'}
        </Button>
      </Card>
    );
  }

  if (isSetup && qrCode) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Setup Two-Factor Authentication</h3>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">1. Scan QR Code</h4>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <img src={qrCode} alt="2FA QR Code" className="mx-auto" />
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Save Backup Codes</h4>
            <p className="text-sm text-gray-600 mb-4">
              Save these backup codes in a safe place. You can use them if you lose access to your authenticator app.
            </p>
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <code className="text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </code>
            </div>
            <Button onClick={downloadBackupCodes} variant="outline" className="mb-4">
              Download Backup Codes
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Verify Setup</h4>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app to complete setup
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              <Button
                onClick={handleVerify}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <p className="text-sm text-gray-600 mb-4">
        Add an extra layer of security to your account by enabling two-factor authentication.
      </p>
      <Button onClick={handleSetup} disabled={loading}>
        {loading ? 'Setting up...' : 'Enable 2FA'}
      </Button>
    </Card>
  );
}
