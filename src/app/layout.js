import './globals.css';

export const metadata = {
  title: 'Job Apply Agent Pro',
  description: 'AI-powered job application automation that finds, tailors, applies, and tracks jobs across multiple platforms',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-slate-950 text-slate-200">
        {children}
      </body>
    </html>
  );
}
