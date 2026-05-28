import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Way of the Image",
  description: "Dream Image Reader — Orientational Approach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="header">Inspired by the orientational approach of Yoram Kaufmann</header>
        {children}
      </body>
    </html>
  );
}
