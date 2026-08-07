import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PataAI - Location Intelligence Platform",
  description: "AI Powered Indian Address Understanding and Last-Mile Logistics Optimization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-slate-950 text-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
