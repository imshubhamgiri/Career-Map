import { apiClient, ApiError } from "@/lib/api-client";
import type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
  VerificationResponse,
} from "../types";

export async function loginUser(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  try {
    return await apiClient.post<LoginResponse>("/auth/login", credentials);
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message,
        status: error.status,
        code: error.code,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during login.",
    };
  }
}

export async function registerUser(credentials: RegisterCredentials): Promise<RegisterResponse> {
  try {
    const response = await apiClient.post<RegisterResponse>("/auth/register", credentials);
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        success: false,
        message: error.message,
        status: error.status,
        code: error.code,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during registration.",
    };
  }
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/auth/verify-email", { email, code });
}

export async function resendVerification(email: string): Promise<VerificationResponse> {
  return apiClient.post<VerificationResponse>("/auth/resend-verification", { email });
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<{ user: AuthUser }>("/auth/me");
  return response.user;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post("/auth/logout");
}