import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { MailProvider } from "@/contexts/MailContext";
import { PaycheckProvider } from "@/contexts/PaycheckContext";
import Navbar from "@/components/Navbar";
import DisclaimerWarning from "@/components/DisclaimerWarning";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yates Inc. - The Future of Absurd Commerce",
  description: "Premium products with innovative pricing models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-gray-50 dark:bg-gray-900">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900`}
      >
        <AuthProvider>
          <ClientProvider>
            <PaycheckProvider>
              <CartProvider>
                <MailProvider>
                  <DisclaimerWarning />
                  <Navbar />
                  <main className="pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
                    {children}
                  </main>
                </MailProvider>
              </CartProvider>
            </PaycheckProvider>
          </ClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
