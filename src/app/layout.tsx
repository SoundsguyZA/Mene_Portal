import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mene' Portal - Multi-Agent AI Platform",
  description: "Multi-agent AI collaboration platform. Import your own agents, use MCP tools, and access memory systems. Blank slate approach - bring your own AI personas.",
  keywords: ["AI", "Multi-Agent", "Chat", "Knowledge", "Memory", "Collaboration", "Mene Portal", "MCP"],
  authors: [{ name: "Mene' Portal Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Mene' Portal - Multi-Agent AI Platform",
    description: "Multi-agent AI collaboration with memory and MCP tool integration",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
