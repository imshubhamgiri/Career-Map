import type { LoginCredentials, LoginResponse } from "../types";

const MOCK_USER = {
  email: "user@example.com",
  password: "password",
  user: {
    id: "mock-user-1",
    email: "user@example.com",
    name: "John Doe",
  },
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

/**
 * Service layer: this is where a real POST request will eventually live.
 * It currently behaves like an API and returns a delayed mock response.
 */
export async function userLogin(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  await wait(800);

  if (
    credentials.email !== MOCK_USER.email ||
    credentials.password !== MOCK_USER.password
  ) {
    return {
      success: false,
      message: "Invalid email or password.",
    };
  }

  return {
    success: true,
    message: "Login successful.",
    token: "mock-auth-token",
    user: MOCK_USER.user,
  };
}