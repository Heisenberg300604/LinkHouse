import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from '@/components/providers';
import './globals.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import { shadcn } from '@clerk/ui/themes';
export const metadata: Metadata = {
  title: { default: 'Linkhouse — A home for everything you share', template: '%s · Linkhouse' },
  description:
    'Your work, your ideas, your corner of the internet. Bring it all together with Linkhouse.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = <Providers>{children}</Providers>;
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider
            appearance={{
              theme: shadcn,
              variables: {
                colorPrimary: '#4F46E5',
                colorBackground: 'var(--surface)',
                colorForeground: 'var(--text)',
                colorMutedForeground: 'var(--muted)',
                borderRadius: '0.75rem',
                fontFamily: 'Inter, Arial, sans-serif',
              },
            }}
          >
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
