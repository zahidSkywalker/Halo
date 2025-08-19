import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'HALO - Modern Social Media Platform',
    template: '%s | HALO'
  },
  description: 'Connect, share, and discover on HALO - the next generation social media platform built for meaningful connections.',
  keywords: ['social media', 'social network', 'connect', 'share', 'discover', 'community'],
  authors: [{ name: 'HALO Team' }],
  creator: 'HALO Team',
  publisher: 'HALO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'HALO - Modern Social Media Platform',
    description: 'Connect, share, and discover on HALO - the next generation social media platform.',
    siteName: 'HALO',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HALO Social Media Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HALO - Modern Social Media Platform',
    description: 'Connect, share, and discover on HALO - the next generation social media platform.',
    images: ['/og-image.png'],
    creator: '@halo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                border: '1px solid var(--toast-border)',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}