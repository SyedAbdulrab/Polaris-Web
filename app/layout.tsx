import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Polaris',
  description: 'Your north-star metrics — finances, streaks, goals, and the life dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
