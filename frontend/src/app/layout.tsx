import type { Metadata } from "next";
// @ts-ignore Next.js handles this global CSS import at build time.
import "./globals.css";

export const metadata: Metadata = {
  title: "Career OS",
  description: "Personal Career Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
