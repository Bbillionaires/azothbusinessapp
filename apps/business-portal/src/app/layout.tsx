import type { Metadata } from 'next';
import './globals.css';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Business Portal — Local First Rewards™',
    template: '%s | Local First Rewards™ Business Portal',
  },
  description:
    'Manage your Local First Rewards™ business listing, track analytics, respond to reviews, and grow your customer base.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 font-sans antialiased text-gray-900">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
