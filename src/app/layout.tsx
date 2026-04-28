import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Apply Agent - AI-Powered Job Search Automation",
  description: "Find matching jobs, tailor your resume, and apply automatically",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
