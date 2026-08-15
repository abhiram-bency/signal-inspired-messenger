/**
 * Root layout — Signal-Inspired Messenger.
 *
 * Architecture reference: ARCHITECTURE §8 (Next.js App Router)
 * Spec reference: MASTER_PROJECT_SPEC §54
 *
 * Phase 0: Establishes the root HTML shell, fonts, metadata, and global styles.
 * Phase 5+: Authentication provider wraps children here.
 * Phase 8+: Toast/notification provider wraps children here.
 */

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ToastContainer } from '../components/ui/ToastContainer';

// ── Inter from Google Fonts ─────────────────────────────────────────────────
// Spec reference: ARCHITECTURE §13 (Typography)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// ── Static metadata ──────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Signal",
    template: "%s | Signal",
  },
  description:
    "A Signal-inspired secure messaging platform. Send messages, join group chats, and stay connected — all in real time.",
  keywords: ["messaging", "chat", "signal", "real-time", "encrypted"],
  authors: [{ name: "Signal-Inspired Messenger" }],
  robots: { index: false, follow: false }, // Not a public-facing site
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b1b1d",
};

// ── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased text-text-primary bg-bg-primary h-screen w-screen overflow-hidden">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
