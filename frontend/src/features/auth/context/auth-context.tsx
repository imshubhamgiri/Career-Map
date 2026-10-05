"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCurrentUser,
  logoutUser,
  loginUser,
  registerUser,
  resendVerification as resendVerificationRequest,
  verifyEmail as verifyEmailRequest,
} from "../services/auth.service";
import { ApiError } from "@/lib/api-client";
import type {
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterCredentials,
  RegisterResponse,
  VerificationResponse,
} from "../types";

export interface AuthContextValue {
  user: AuthUser | null;
  isInitializing: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<RegisterResponse>;
  verifyEmail: (email: string, code: string) => Promise<boolean>;
  resendVerification: (email: string) => Promise<VerificationResponse>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser();

        if (!cancelled) {
          setUser(currentUser);
        }
      } catch (cause) {
        if (!cancelled) {
          setUser(null);
          // A 401 means there is no active session; other errors should be visible.
          if (!(cause instanceof ApiError && cause.status === 401)) {
            // setError(
            //   cause instanceof Error
            //     ? cause.message
            //     : "Unable to restore your session.",
            // );
          }
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginUser(credentials);

      if (!response.success || !response.user) {
        setError(response.message || "Unable to sign in.");
        return response;
      }
      setUser(response.user);
      return response;
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to sign in.",
      );
      return {
        success: false,
        message: cause instanceof Error ? cause.message : "Unable to sign in.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await registerUser(credentials);
      if (!response.success || !response.user) {
        setError(response.message || "Unable to register.");
        return response;
      }
      setUser(response.user);
      return response;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to register.",
      );
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to register.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await logoutUser();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to sign out.",
      );
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await verifyEmailRequest(email, code);
      if (!response.success || !response.user) {
        setError(response.message || "Unable to verify email.");
        return false;
      }
      setUser(response.user);
      return true;
    }catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to verify email.",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    try {
      return await resendVerificationRequest(email);
    } catch (cause) {
      return {
        success: false,
        message: cause instanceof Error
          ? cause.message
          : "Unable to resend verification code.",
      };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      isLoading,
      isAuthenticated: user !== null && user.isEmailVerified !== false,
      error,
      login,
      logout,
      register,
      verifyEmail,
      isEmailVerified: user?.isEmailVerified ?? false,
      resendVerification,
    }),
    [user, isInitializing, isLoading, error, login, logout, register, verifyEmail, resendVerification],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
