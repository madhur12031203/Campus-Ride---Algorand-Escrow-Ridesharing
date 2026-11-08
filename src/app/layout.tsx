import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Campus Ride | Go together. Get there better.",
  description: "Connect with your campus. Find shared rides, offer a seat, and compare estimated fares for a better everyday commute.",
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
