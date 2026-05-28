import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { CurrencyProvider } from '@/lib/currency-context';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Polaris',
  description: 'Your north-star metrics — finances, streaks, goals, and the life dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
