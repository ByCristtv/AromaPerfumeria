import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/footer/Footer";
import FooterGate from "@/components/layout/footer/FooterGate";
import QueryProvider from "@/components/providers/QueryProvider";
import AuthListener from "@/components/auth/AuthListener";

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
          <FooterGate>
            <Footer />
          </FooterGate>
        </QueryProvider>
      </body>
    </html>
  );
}