import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { MockFetchProvider } from "@/components/MockFetchProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RetailFlow POS - Fast Billing for Retail Stores",
  description: "Simple, fast, modern POS billing system for small retail stores. Bill 200+ customers/day without slowdowns.",
  keywords: ["POS", "Retail", "Billing", "Point of Sale", "Invoice", "Inventory"],
  authors: [{ name: "RetailFlow Team" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <MockFetchProvider>
          {children}
        </MockFetchProvider>
        <Toaster />
      </body>
    </html>
  );
}

