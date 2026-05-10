import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import OfflineBanner from "@/components/OfflineBanner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Traveloop X — AI Travel Operating System",
  description: "Cinematic AI-powered intelligent travel OS. Plan, collaborate, and explore with real-time AI itinerary generation, adaptive engines, and offline-first reliability.",
  keywords: ["travel planning", "AI itinerary", "travel app", "collaborative travel", "smart travel"],
  authors: [{ name: "Traveloop X" }],
  openGraph: {
    title: "Traveloop X — AI Travel OS",
    description: "Transform any travel prompt into a cinematic AI-powered itinerary in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#06b6d4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col relative" suppressHydrationWarning>
        <div className="noise-overlay" />
        <Providers>
          <OfflineBanner />
          {children}
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').then(r => console.log('[SW] Registered')).catch(e => console.log('[SW] Failed', e)); }); }`,
          }}
        />
      </body>
    </html>
  );
}
