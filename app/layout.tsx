import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import AuthListener from "@/components/auth/AuthListener";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Aroma Perfumeria",
  description: "Aroma Perfumeria website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthListener />
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}