import { useCallback, useEffect, useState } from "react";
import { userLogin } from "../services/userLogin";
import type { AuthUser, LoginCredentials } from "../types";

export function useUserLogin() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.localStorage.getItem("authToken");

    if (token) {
      setUser({
        id: "mock-user-1",
        email: "user@example.com",
        name: "John Doe",
      });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userLogin(credentials);

      if (!response.success || !response.user || !response.token) {
        setError(response.message);
        return response;
      }

      window.localStorage.setItem("authToken", response.token);
      setUser(response.user);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("authToken");
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    isLoggedIn: user !== null,
    isLoading,
    error,
    login,
    logout,
  };
}