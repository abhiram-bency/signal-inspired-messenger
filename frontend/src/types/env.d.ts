/**
 * Global type declarations for environment variables.
 *
 * All NEXT_PUBLIC_* variables are baked into the browser bundle at build time.
 * Server-only env vars (without the prefix) are never sent to the client.
 *
 * Spec reference: MASTER_PROJECT_SPEC §54
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Base URL of the FastAPI backend REST API. */
    readonly NEXT_PUBLIC_API_URL: string;

    /** WebSocket base URL of the FastAPI backend. */
    readonly NEXT_PUBLIC_WS_URL: string;

    /** Application display name shown in the UI. */
    readonly NEXT_PUBLIC_APP_NAME: string;

    readonly NODE_ENV: "development" | "production" | "test";
  }
}
