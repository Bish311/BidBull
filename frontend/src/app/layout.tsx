import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidBull — Real-Time Auction Engine",
  description: "High-concurrency digital auction platform with proxy bidding and soft close.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0c0d11] text-gray-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
