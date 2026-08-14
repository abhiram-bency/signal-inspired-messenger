/**
 * Application root page — Phase 0 shell.
 *
 * Spec reference: MASTER_PROJECT_SPEC §8 (Application Shell)
 * Architecture reference: ARCHITECTURE §8 (Next.js App Router)
 *
 * Phase 0:
 *   Renders a minimal "application is running" page that:
 *   - Confirms the Next.js frontend is working
 *   - Shows the implementation status
 *   - Provides links to documentation
 *
 * Phase 5+:
 *   This page redirects unauthenticated users to /auth/login and
 *   authenticated users to /app (the Signal-style main layout).
 *   All current content here is replaced by auth-aware routing.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signal — Secure Messaging Platform",
};

// ── Implementation status ─────────────────────────────────────────────────────
const PHASES = [
  { id: 0, label: "Repository Bootstrap", status: "complete" },
  { id: 1, label: "Backend Configuration", status: "complete" },
  { id: 2, label: "Database Foundation", status: "pending" },
  { id: 3, label: "Seed Data", status: "pending" },
  { id: 4, label: "Domain Models & Repositories", status: "pending" },
  { id: 5, label: "Authentication", status: "pending" },
  { id: 6, label: "Profile", status: "pending" },
  { id: 7, label: "Contacts", status: "pending" },
  { id: 8, label: "Conversation System", status: "pending" },
  { id: 9, label: "REST API", status: "pending" },
  { id: 10, label: "WebSocket Infrastructure", status: "pending" },
  { id: 11, label: "Real-Time Messaging", status: "pending" },
  { id: 12, label: "Receipts & Typing", status: "pending" },
  { id: 13, label: "Group Conversations", status: "pending" },
  { id: 14, label: "Signal UI Polish", status: "pending" },
  { id: 15, label: "Testing & Deployment", status: "pending" },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const completedCount = PHASES.filter((p) => p.status === "complete").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ── Logo area ── */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, var(--color-signal-blue) 0%, var(--color-signal-teal) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            fontSize: "2rem",
          }}
        >
          ✦
        </div>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
            color: "var(--color-text-primary)",
          }}
        >
          Signal
        </h1>
        <p
          style={{
            marginTop: "0.5rem",
            color: "var(--color-text-secondary)",
            fontSize: "0.9375rem",
          }}
        >
          Secure Messaging Platform — Phase 0 Shell
        </p>
      </div>

      {/* ── Status card ── */}
      <div
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "2rem",
          width: "100%",
          maxWidth: "520px",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            Implementation Status
          </h2>
          <span
            style={{
              fontSize: "0.8125rem",
              color: "var(--color-text-secondary)",
              background: "var(--color-bg-overlay)",
              padding: "0.25rem 0.75rem",
              borderRadius: "99px",
            }}
          >
            {completedCount} / {PHASES.length} phases
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {PHASES.map((phase) => (
            <div
              key={phase.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                background:
                  phase.status === "complete"
                    ? "rgba(34, 197, 94, 0.08)"
                    : "transparent",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background:
                    phase.status === "complete"
                      ? "var(--color-success)"
                      : "var(--color-bg-overlay)",
                  color:
                    phase.status === "complete"
                      ? "#fff"
                      : "var(--color-text-muted)",
                  fontWeight: 700,
                }}
              >
                {phase.status === "complete" ? "✓" : phase.id}
              </span>
              <span
                style={{
                  fontSize: "0.875rem",
                  color:
                    phase.status === "complete"
                      ? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                  fontWeight: phase.status === "complete" ? 500 : 400,
                }}
              >
                {phase.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech stack ── */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "2rem",
        }}
      >
        {[
          "Next.js 15",
          "TypeScript",
          "Tailwind CSS",
          "FastAPI",
          "SQLite",
          "WebSocket",
        ].map((tech) => (
          <span
            key={tech}
            style={{
              fontSize: "0.8125rem",
              padding: "0.25rem 0.75rem",
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "99px",
              color: "var(--color-text-secondary)",
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* ── Links ── */}
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          fontSize: "0.875rem",
          color: "var(--color-text-muted)",
        }}
      >
        <a
          href="/api/health"
          style={{ color: "var(--color-signal-blue)", textDecoration: "none" }}
        >
          Backend Health ↗
        </a>
        <a
          href="/api/docs"
          style={{ color: "var(--color-signal-blue)", textDecoration: "none" }}
        >
          API Docs ↗
        </a>
      </div>

      <p
        style={{
          marginTop: "3rem",
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          textAlign: "center",
        }}
      >
        This page is a Phase 0 placeholder.
        <br />
        The full Signal-style UI is implemented in Phase 8+.
      </p>
    </div>
  );
}
