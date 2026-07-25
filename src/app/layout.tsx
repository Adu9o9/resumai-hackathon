import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumAI",
  description: "AI-powered resume and job description matching for fast hackathon teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
