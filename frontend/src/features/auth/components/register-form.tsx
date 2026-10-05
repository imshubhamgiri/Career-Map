"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import type { RegisterCredentials } from "../types";
import { AuthForm, type AuthFormValues } from "./form";
import { InputOTPForm } from "./otp-verification";

export function RegisterForm() {
  const { error, isInitializing, isLoading, register } = useAuth();
  const router = useRouter();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  async function handleSubmit(values: AuthFormValues) {
    const credentials: RegisterCredentials = {
      email: values.email,
      password: values.password,
      name: values.name ?? "",
    };
    const response = await register(credentials);

    if (response.success && response.user) {
      setPendingEmail(response.user.email);
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
      mode="register"
      error={error}
      isInitializing={isInitializing}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}
