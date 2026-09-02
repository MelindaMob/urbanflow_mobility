import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UrbanFlow Mobility",
  description: "Plateforme de mobilité urbaine multimodale et durable",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UrbanFlow",
  },
};

export const viewport = {
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://api.maptiler.com" />
        <link rel="preconnect" href="https://api.openrouteservice.org" />
        <link rel="preconnect" href="https://bdx.mecatran.com" />
        <link rel="dns-prefetch" href="https://api.maptiler.com" />
      </head>
      <body className="bg-off-white text-anthracite font-sans antialiased">
        {children}
      </body>
    </html>
  );
}