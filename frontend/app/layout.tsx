import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { AppHeader } from '@/components/AppHeader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Infield Spray Record — QA Console',
  description:
    'Mobile-first progressive web app for capturing spray applications, GPS, weather, and audit-ready PDFs.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 pb-20 pt-10">
              {children}
            </main>
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}
