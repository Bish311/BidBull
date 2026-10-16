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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('bidbull_theme');
                if (saved === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-brand-bg text-brand-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
