"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/use-auth";
import type { RegisterCredentials } from "../types";
import { AuthForm, type AuthFormValues } from "./form";
import { InputOTPForm } from "./otp-verification";

export function RegisterForm() {
  const { error, isAuthenticated, isInitializing, isLoading, register } = useAuth();
  const router = useRouter();
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitializing && isAuthenticated && !pendingEmail) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isInitializing, pendingEmail, router]);

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

  if (isInitializing || (isAuthenticated && !pendingEmail)) {
    return (
      <div className="w-full max-w-sm flex items-center justify-center p-12">
        <div className="w-6 h-6 border-2 border-brand-indigo-light dark:border-brand-indigo border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
