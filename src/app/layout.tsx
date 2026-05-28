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
        <div className="topbar">
          <strong>The Way of the Image</strong> &nbsp;·&nbsp; Orientational Approach
        </div>
        {children}
      </body>
    </html>
  );
}
