import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinanSys - Seu Sistema Financeiro",
  description: "Gerencie suas finanças com facilidade.",
};

import { SocketProvider } from "@/components/providers/SocketProvider";
import { VisibilityProvider } from "@/components/providers/VisibilityProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.className} antialiased`}
      >
        <AuthProvider>
          <SocketProvider>
            <VisibilityProvider>
              {children}
              <Toaster />
            </VisibilityProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
