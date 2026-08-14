/**
 * 404 — Not Found page.
 *
 * Rendered automatically by Next.js for any unmatched route.
 * Spec reference: MASTER_PROJECT_SPEC §43 (Error Handling)
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <p
        style={{
          fontSize: "5rem",
          fontWeight: 800,
          letterSpacing: "-0.05em",
          margin: 0,
          color: "var(--color-border)",
        }}
      >
        404
      </p>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          margin: "1rem 0 0.5rem",
        }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "0.9375rem",
          margin: "0 0 2rem",
        }}
      >
        This page does not exist or you may not have permission to view it.
      </p>
      <Link
        href="/"
        style={{
          color: "var(--color-signal-blue)",
          textDecoration: "none",
          fontSize: "0.9375rem",
          fontWeight: 500,
        }}
      >
        ← Back to home
      </Link>
    </div>
  );
}
