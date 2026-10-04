import type { Metadata } from "next";
import { LoginForm } from "@features/auth";

export const metadata: Metadata = {
  title: "Log in — Career OS",
  description: "Sign in to your Career OS account",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-dark-bg">
      <LoginForm />
    </main>
  );
}
