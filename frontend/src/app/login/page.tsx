'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApiWithCredentials } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetchApiWithCredentials<{ data: { otp_required: boolean } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier })
      });
      
      if (res.data?.otp_required) {
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find account.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetchApiWithCredentials<{ data: { authenticated: boolean, user: any } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, otp })
      });
      
      if (res.data?.authenticated) {
        setUser(res.data.user);
        router.push('/chat'); // Redirect to protected route
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Signal-inspired</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {step === 1 ? 'Sign in to your account' : 'Enter your verification code'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username or Phone Number
              </label>
              <input
                id="identifier"
                type="text"
                required
                className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="alice"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !identifier.trim()}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Connecting...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verification Code (OTP)
              </label>
              <p className="text-xs text-gray-500 mb-2">Development: use 123456</p>
              <input
                id="otp"
                type="text"
                required
                className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:text-white text-center tracking-widest text-lg font-mono"
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
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(''); }}
              className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline text-center mt-2"
            >
              Back to login
            </button>
          </form>
        )}

        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
