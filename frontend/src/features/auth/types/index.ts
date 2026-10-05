export interface User {
  id: string;
  email: string;
  name: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  accessToken?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  isEmailVerified?: boolean;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  accessToken?: string;
  user?: AuthUser;
}
