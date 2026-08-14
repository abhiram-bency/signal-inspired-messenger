/**
 * Centralised API client.
 *
 * All REST requests from the frontend must go through this module.
 * Components and hooks must never construct raw fetch() calls.
 *
 * Architecture reference: ARCHITECTURE §13 (API Client)
 * Spec reference: API_SPEC §3 (Base URL)
 *
 * Phase 0: Provides the base infrastructure.
 * Phase 5+: Will add authentication header injection, token refresh, and
 *            typed response helpers per resource domain.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Standard error shape returned by the FastAPI backend. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, string> | null;
  };
}

/** Thrown when the backend returns a non-2xx response. */
export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: Record<string, string> | null;

  constructor(status: number, error: ApiError["error"]) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
  }
}

/**
 * Core fetch wrapper.
 *
 * - Prepends the backend base URL.
 * - Sends credentials (cookies) with every request.
 * - Parses JSON responses.
 * - Throws ApiRequestError for non-2xx responses.
 */
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: "include", // Required for HttpOnly cookie auth
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  // 204 No Content — return empty object
  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();

  if (!response.ok) {
    // Backend always returns { error: { code, message, details } }
    throw new ApiRequestError(response.status, json.error ?? {
      code: "UNKNOWN_ERROR",
      message: `HTTP ${response.status}`,
      details: null,
    });
  }

  return json as T;
}

/** Convenience helpers for HTTP verbs. */
export const api = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(path: string, options?: RequestInit) =>
    request<T>(path, { method: "DELETE", ...options }),
};

/**
 * Health check — verifies frontend can reach the backend.
 * Used on the minimal shell page to surface connectivity problems early.
 */
export async function checkBackendHealth(): Promise<{ status: string }> {
  return api.get<{ status: string }>("/health");
}
