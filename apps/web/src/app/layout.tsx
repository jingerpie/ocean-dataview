import { cn } from "@ocean-dataview/dataview/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "@/components/client-providers";
import { SiteHeader } from "@/components/layouts/site-header";
import ServerProviders from "@/components/server-providers";

import "../index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ocean-dataview",
  description: "ocean-dataview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          `${geistSans.variable} ${geistMono.variable}`
        )}
      >
        <ServerProviders>
          <ClientProviders>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="container flex-1 py-8">{children}</main>
            </div>
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  );
}
