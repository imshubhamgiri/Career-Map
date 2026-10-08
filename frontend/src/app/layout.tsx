import type { Metadata } from "next";
import { cookies } from "next/headers";
// @ts-ignore Next.js handles this global CSS import at build time.
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Career OS",
  description: "Personal Career Operating System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("cos-theme")?.value;
  // Default to dark mode as defined in design specs, or honor user's saved cookie
  const initialTheme: "dark" | "light" = themeCookie === "light" ? "light" : "dark";

  return (
    <html
      lang="en"
      className={cn(initialTheme, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Providers initialTheme={initialTheme}>{children}</Providers>
      </body>
    </html>
  );
}
