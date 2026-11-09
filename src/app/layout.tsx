import type { Metadata } from "next";
import "./globals.css";
import "./ride-design.css";
import "./ride-map.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Campus Ride | Going the same way?",
  description: "Request a pickup, offer a seat, and track your shared rides in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
