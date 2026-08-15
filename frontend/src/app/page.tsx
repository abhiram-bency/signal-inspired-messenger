'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchApiWithCredentials } from '@/lib/api';
import { Shield, MessageCircle, Lock, Zap, Users, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If the user already has a valid session, redirect to /chat
    async function checkAuth() {
      try {
        const res = await fetchApiWithCredentials<{ data: { id: string } }>('/auth/me');
        if (res?.data?.id) {
          router.replace('/chat');
          return;
        }
      } catch {
        // Not authenticated — stay on landing page
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-pulse flex flex-col items-center">
          <Shield className="h-10 w-10 text-blue-500 mb-4" />
          <p className="text-gray-400 font-medium text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Signal-Inspired</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-8">
            <Lock className="h-3 w-3" />
            Privacy-focused messaging
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white">
            Say hello to
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              private messaging
            </span>
          </h1>
          <p className="mt-5 text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            A Signal-inspired messaging platform with real-time conversations,
            secure sessions, and a modern interface. Built for speed and simplicity.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
          >
            Create Account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Demo hint */}
        <p className="mt-6 text-xs text-gray-500">
          Demo users available — sign in as <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">alice</code> with OTP <code className="text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">123456</code>
        </p>
      </main>

      {/* Features */}
      <section className="px-6 pb-16 pt-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FeatureCard
            icon={<MessageCircle className="h-5 w-5" />}
            title="Real-Time Chat"
            description="Instant message delivery with WebSocket connections and optimistic UI updates."
          />
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Secure Sessions"
            description="Cookie-based authentication with server-side session management."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Group Conversations"
            description="Create groups, direct messages, and manage conversations with ease."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <span>Signal-Inspired Messenger — Internship Assignment</span>
          <div className="flex gap-4">
            <span>Next.js</span>
            <span>FastAPI</span>
            <span>WebSocket</span>
            <span>SQLite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-sm text-white mb-1.5">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
