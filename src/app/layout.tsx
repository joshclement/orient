import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orient — Dream Analysis Inspired by Yoram Kaufmann",
  description: "A dream image tool based on Yoram Kaufmann's orientational approach from The Way of the Image. Enter your dream, explore each image objectively.",
  openGraph: {
    title: "Orient — Dream Analysis Inspired by Yoram Kaufmann",
    description: "A dream image tool based on Yoram Kaufmann's orientational approach from The Way of the Image. Enter your dream, explore each image objectively.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Orient — Dream Analysis Inspired by Yoram Kaufmann",
    description: "A dream image tool based on Yoram Kaufmann's orientational approach from The Way of the Image. Enter your dream, explore each image objectively.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
