/**
 * User domain types.
 *
 * Matches API_SPEC §23 (Get Profile), §24 (Update Profile), §26 (Search).
 * Spec reference: MASTER_PROJECT_SPEC §12 (User Model), DATABASE_DESIGN §9 (Users Table)
 */

/** Public-safe user representation returned by most endpoints. */
export interface User {
  id: string;
  username: string | null;
  phone: string | null;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen_at: string | null; // ISO 8601
}

/** Minimal user reference used inside nested objects (e.g. conversation members). */
export interface UserRef {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface UpdateProfileRequest {
  display_name?: string;
  avatar_url?: string;
}

export interface UserSearchResponse {
  data: User[];
  meta: { count: number };
}
