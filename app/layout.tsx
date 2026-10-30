import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';
import { Providers } from '@/components/providers';
import { clerkAppearance } from '@/lib/clerk-appearance';
import './globals.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';

export const metadata: Metadata = {
  title: { default: 'Linkhouse — One link for everything you share', template: '%s · Linkhouse' },
  description:
    'Linkhouse is a link-in-bio page for creators and professionals: one address for your links, a live preview, and analytics that show what people click.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf9f7' },
    { media: '(prefers-color-scheme: dark)', color: '#0c0a09' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = <Providers>{children}</Providers>;
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider appearance={clerkAppearance}>{content}</ClerkProvider>
        ) : (
          content
        )}
        <Analytics />
      </body>
    </html>
  );
}
