import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const boska = localFont({
  variable: "--font-boska-family",
  display: "swap",
  src: [
    { path: "../public/fonts/boska-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/boska-medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/boska-bold.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Almanac",
    template: "%s | Almanac",
  },
  description: "A private ledger for the movies you watch and books you read.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${boska.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
