import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevPort',
  description: 'Your developer portfolio, made easy.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
