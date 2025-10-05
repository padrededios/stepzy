import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { LayoutProvider } from '@/components/layout/LayoutProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Stepzy - Plateforme Multisports',
  description: 'Plateforme de réservation et gestion d\'activités sportives',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <LayoutProvider>
          {children}
        </LayoutProvider>
      </body>
    </html>
  );
}
