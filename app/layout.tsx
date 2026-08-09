import type { Metadata } from "next";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Kotobna",
  description: "A personal collection of books, available to browse and request.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <header className="border-b border-ink/10 px-5 sm:px-8 py-4 flex items-center justify-between">
          <a href="/" className="font-display text-2xl font-semibold text-forest">
            Kotobna
          </a>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
            &#1603;&#1578;&#1576;&#1606;&#1575;
          </span>
        </header>
        {children}
      </body>
    </html>
  );
}
