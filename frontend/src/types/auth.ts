/**
 * Authentication domain types.
 *
 * Matches API_SPEC §13 (Register), §16 (Verify OTP), §18 (Login), §21 (Me).
 * Spec reference: API_SPEC §5 (Authentication Model)
 */

export interface RegisterRequest {
  username: string | null;
  phone: string | null;
  display_name: string;
}

export interface VerifyOtpRequest {
  identifier: string; // username or phone
  otp: string;
}

export interface LoginRequest {
  identifier: string;
  otp?: string;
}

export interface AuthResponse {
  data: {
    authenticated: boolean;
    user: {
      id: string;
      username: string | null;
      display_name: string;
      avatar_url: string | null;
    };
  };
}

export interface RegisterResponse {
  data: {
    user: {
      id: string;
      username: string | null;
      phone: string | null;
      display_name: string;
      avatar_url: string | null;
    };
    otp_required: boolean;
  };
}
