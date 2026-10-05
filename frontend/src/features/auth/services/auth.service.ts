import { apiClient, ApiError } from "@/lib/api-client";
import type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
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

export async function verifyEmail(email: string): Promise<void> {
  await apiClient.post("/auth/verify-email", { email });
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<{ user: AuthUser }>("/auth/me");
  return response.user;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post("/auth/logout");
}