import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Password Strength Checker",
  description: "Check the strength of your password.",
  generator: "Pranav Sharma",
  icons: './favicon.ico',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics /> {/* ✅ Add Vercel Analytics here */}
      </body>
    </html>
  );
}
