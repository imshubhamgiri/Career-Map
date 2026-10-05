"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AuthFormValues {
  email: string;
  password: string;
  name?: string;
}

interface AuthFormProps {
  mode: "login" | "register";
  error: string | null;
  isInitializing: boolean;
  isLoading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<void>;
}

export function AuthForm({
  mode,
  error,
  isInitializing,
  isLoading,
  onSubmit,
}: AuthFormProps) {
  const isRegister = mode === "register";
  const isDisabled = isInitializing || isLoading;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    await onSubmit({
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      password: String(formData.get("password") ?? ""),
      ...(isRegister
        ? { name: String(formData.get("name") ?? "").trim() }
        : {}),
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>
          {isRegister ? "Create your account" : "Login to your account"}
        </CardTitle>
        <CardDescription>
          {isRegister
            ? "Create your Career OS workspace"
            : "Enter your email below to login to your account"}
        </CardDescription>
        <CardAction>
          <Link
            href={isRegister ? "/login" : "/register"}
            className="text-sm underline-offset-4 hover:underline"
          >
            {isRegister ? "Log in" : "Sign Up"}
          </Link>
        </CardAction>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-col gap-6">
            {isRegister && (
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  minLength={2}
                  required
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {!isRegister && (
                  <Link
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isDisabled}>
            {isLoading
              ? isRegister
                ? "Creating account..."
                : "Logging in..."
              : isRegister
                ? "Create account"
                : "Login"}
          </Button>
          <Button type="button" variant="outline" className="w-full">
            {isRegister ? "Continue with Google" : "Login with Google"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
