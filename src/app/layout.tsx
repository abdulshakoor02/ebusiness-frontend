import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "eBusiness CRM",
        template: "%s | eBusiness CRM",
    },
    description: "eBusiness CRM - A comprehensive customer relationship management solution for tracking leads, managing appointments, and growing your business. Streamline your sales pipeline with powerful tools for lead management, follow-ups, and invoicing.",
    keywords: ["CRM", "customer relationship management", "lead management", "sales pipeline", "business management", "eBusiness"],
    authors: [{ name: "eBusiness" }],
    creator: "eBusiness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
