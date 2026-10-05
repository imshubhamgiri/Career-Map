"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import type { LoginCredentials } from "../types";
import { AuthForm, type AuthFormValues } from "./form";
import { InputOTPForm } from "./otp-verification";

export function LoginForm() {
  const { error, isInitializing, isLoading, login } = useAuth();
  const router = useRouter();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function handleSubmit(values: AuthFormValues) {
    const credentials: LoginCredentials = {
      email: values.email,
      password: values.password,
    };
    const response = await login(credentials);

    if (response.success) {
      router.push("/dashboard");
      return;
    }

    if (response.code === "EMAIL_NOT_VERIFIED" || response.status === 403) {
      setPendingEmail(credentials.email);
    }
  }

  if (pendingEmail) {
    return (
      <InputOTPForm
        email={pendingEmail}
        onSuccess={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <AuthForm
      mode="login"
      error={error}
      isInitializing={isInitializing}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}
