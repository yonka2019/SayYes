import type { Metadata } from "next";
import { Varela_Round } from "next/font/google";
import "./globals.css";

const varela = Varela_Round({
  subsets: ["hebrew", "latin"],
  weight: "400",
  display: "swap",
  variable: "--font-varela",
});

export const metadata: Metadata = {
  title: "תגידי כן",
  description: "הזמנות דייט חמודות",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={varela.variable}>
      <body className="min-h-screen bg-blush antialiased">{children}</body>
    </html>
  );
}
