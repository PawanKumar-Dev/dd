import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import TestingModeIndicator from '@/components/TestingModeIndicator';
import TestingModeBanner from '@/components/TestingModeBanner';
import { TestingModeProvider } from '@/components/TestingModeProvider';
import ClientOnly from '@/components/ClientOnly';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Excel Technologies - Domain Management System',
  description: 'Excel Technologies - Professional domain management and digital solutions',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TestingModeProvider>
          {children}
          <ClientOnly>
            <TestingModeIndicator />
          </ClientOnly>
          <Toaster position="top-right" />
        </TestingModeProvider>
      </body>
    </html>
  );
}
