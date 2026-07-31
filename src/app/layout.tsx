import { safeJsonLd } from '@/lib/jsonld'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as ToasterSonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { CookieConsent } from "@/components/storefront/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO: metadataBase + canonical URLs (SEO panel P1).
// All relative OG/Twitter URLs resolve against this base.
const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://himal-commerce.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Himal Commerce — Nepal's Headless Commerce Platform",
    template: "%s · Himal Commerce",
  },
  description:
    "Buy and sell authentic Nepali-made goods — from Dhaka topis to Pashmina shawls, Ilam tea to Gurkha Khukuris. Pay with eSewa, Khalti, or cash on delivery, shipped across all 77 districts of Nepal.",
  keywords: [
    "Nepal ecommerce",
    "Himal Commerce",
    "Nepali products",
    "Dhaka topi",
    "Pashmina",
    "Ilam tea",
    "Gurkha khukuri",
    "eSewa",
    "Khalti",
    "headless commerce",
    "multi-tenant SaaS",
  ],
  authors: [{ name: "Himal Commerce" }],
  creator: "Himal Commerce",
  publisher: "Himal Commerce",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Himal Commerce — Nepal's Headless Commerce Platform",
    description: "Buy and sell authentic Nepali-made goods across all 77 districts. Multi-tenant commerce for Nepali merchants.",
    siteName: "Himal Commerce",
    type: "website",
    locale: "en_NP",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Himal Commerce",
    description: "Nepal's headless commerce platform — NPR, eSewa, Khalti, COD across all 77 districts.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// SEO: Organization + WebSite JSON-LD (SEO panel P1).
// Helps Google understand the platform entity and enables sitelinks search box.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Himal Commerce",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: "Nepal's multi-tenant headless commerce platform. NPR, eSewa, Khalti, COD across all 77 districts.",
  foundingDate: "2024",
  areaServed: {
    "@type": "Country",
    name: "Nepal",
  },
  sameAs: [
    "https://github.com/bymeanime/himal-commerce",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Himal Commerce",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <CookieConsent />
        <Toaster />
        <ToasterSonner />
      </body>
    </html>
  );
}
