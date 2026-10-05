import type { Metadata } from "next";
import dynamic from 'next/dynamic';
// import { LoginForm } from "@features/auth";
//How to lazily load the login form component in Next.js 13 with the app directory? You can use dynamic imports to achieve this. Here's how you can modify your code to lazily load the LoginForm component:
const LazyRegisterForm =
  dynamic(() => import("@features/auth/components/register-form").then((mod) => mod.RegisterForm), {
   // Disable server-side rendering for this component
    loading: () => <div className="animate-pulse">Loading...</div>, // Optional: You can show a loading indicator while the component is being loaded
  })
export const metadata: Metadata = {
  title: "Register — Career OS",
  description: "Create a new account in Career OS",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-dark-bg">
    <LazyRegisterForm />
    </main>
  );
}
