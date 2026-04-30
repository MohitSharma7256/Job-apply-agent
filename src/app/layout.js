import "./globals.css";

export const metadata = {
  title: "Agent Pro - AI Job Assistant",
  description: "Automate your career with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
