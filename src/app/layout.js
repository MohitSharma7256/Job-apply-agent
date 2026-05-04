import './globals.css';
import './styles.css';

export const metadata = {
  title: 'Job Apply Agent Pro',
  description: 'AI-powered job application automation that finds, tailors, applies, and tracks jobs across multiple platforms',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased" style={{ backgroundColor: 'rgb(2, 6, 23)', color: 'rgb(226, 232, 240)' }}>
        {children}
      </body>
    </html>
  );
}
