import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Traveloop X | AI Travel OS",
  description: "Personalized Travel Planning Made Easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#06b6d4" />
      </head>
      <body className="min-h-full flex flex-col relative" suppressHydrationWarning>
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
