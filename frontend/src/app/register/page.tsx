'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, fetchApiWithCredentials } from '@/lib/api';
import { useAuthStore, User } from '@/stores/authStore';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [identifier, setIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Determine if phone or username (basic heuristic)
    const isPhone = /^\+?[\d\s-]{10,}$/.test(identifier);
    const payload = {
      display_name: displayName,
      username: isPhone ? null : identifier,
      phone: isPhone ? identifier : null,
    };

    try {
      const res = await fetchApi<{ data: { otp_required: boolean } }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      if (res.data?.otp_required) {
        setStep(2);
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetchApiWithCredentials<{ data: { authenticated: boolean, user: Record<string, unknown> } }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier, otp })
      });
      
      if (res.data?.authenticated) {
        setUser(res.data.user as unknown as User);
        router.push('/chat'); // Redirect to protected route
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary">
      <div className="max-w-md w-full p-8 bg-surface-1 rounded-2xl shadow-xl space-y-6 border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-text-primary">Join Signal-inspired</h1>
          <p className="mt-2 text-sm text-text-muted">
            {step === 1 ? 'Create a new account' : 'Enter your verification code'}
          </p>
        </div>

        {error && (
          <div className="bg-error/10 text-error p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-text-secondary">
                Username or Phone Number
              </label>
              <input
                id="identifier"
                type="text"
                required
                className="mt-1 block w-full px-4 py-2.5 bg-surface-2 border border-border-subtle rounded-xl focus:ring-1 focus:ring-signal-blue outline-none text-text-primary placeholder:text-text-muted transition-all"
                placeholder="charlie"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                required
                className="mt-1 block w-full px-4 py-2.5 bg-surface-2 border border-border-subtle rounded-xl focus:ring-1 focus:ring-signal-blue outline-none text-text-primary placeholder:text-text-muted transition-all"
                placeholder="Charlie Day"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !displayName.trim()}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-signal-blue hover:bg-signal-blue-dark focus:outline-none disabled:opacity-50 transition-colors"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-text-secondary">
                Verification Code (OTP)
              </label>
              <p className="text-xs text-text-muted mb-2">Development: use 123456</p>
              <input
                id="otp"
                type="text"
                required
                className="mt-1 block w-full px-4 py-2.5 bg-surface-2 border border-border-subtle rounded-xl focus:ring-1 focus:ring-signal-blue outline-none text-text-primary text-center tracking-widest text-lg font-mono placeholder:text-text-muted transition-all"
                placeholder="------"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-signal-blue hover:bg-signal-blue-dark focus:outline-none disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        <div className="text-center text-sm">
          <span className="text-text-muted">Already have an account? </span>
          <Link href="/login" className="font-medium text-signal-blue hover:text-signal-blue-dark hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
