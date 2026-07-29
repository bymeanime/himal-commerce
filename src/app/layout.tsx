import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as ToasterSonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Himal Commerce — Nepal's Headless Commerce Platform",
  description: "Buy and sell authentic Nepali-made goods — from Dhaka topis to Pashmina shawls, Ilam tea to Gurkha Khukuris. Pay with eSewa, Khalti, or cash on delivery, shipped across all 77 districts of Nepal.",
  keywords: ["Nepal ecommerce", "Himal Commerce", "Nepali products", "Dhaka topi", "Pashmina", "eSewa", "Khalti", "headless commerce"],
  authors: [{ name: "Himal Commerce" }],
  openGraph: {
    title: "Himal Commerce — Nepal's Headless Commerce Platform",
    description: "Buy and sell authentic Nepali-made goods across all 77 districts.",
    siteName: "Himal Commerce",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Himal Commerce",
    description: "Nepal's headless commerce platform — NPR, eSewa, Khalti, COD.",
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
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <ToasterSonner />
      </body>
    </html>
  );
}
