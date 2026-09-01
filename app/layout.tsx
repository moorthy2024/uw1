import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RootLayout } from "@/components/RootLayout";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QBE Commercial Property AI Underwriting",
  description: "QBE NA Excess & Surplus Underwriting",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <RootLayout>{children}</RootLayout>
      </body>
    </html>
  );
}
