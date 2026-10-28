import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from '@/components/providers';
import './globals.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
export const metadata: Metadata = {
  title: { default: 'Linkhouse — A home for everything you share', template: '%s · Linkhouse' },
  description:
    'Your work, your ideas, your corner of the internet. Bring it all together with Linkhouse.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = <Providers>{children}</Providers>;
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider
            appearance={{
              variables: {
                colorPrimary: '#4F46E5',
                colorPrimaryForeground: '#ffffff',
                colorBackground: 'var(--surface)',
                colorForeground: 'var(--text)',
                colorNeutral: 'var(--text)',
                colorBorder: 'var(--border)',
                colorInput: 'var(--surface)',
                colorInputForeground: 'var(--text)',
                colorMuted: 'var(--soft)',
                colorMutedForeground: 'var(--muted)',
                colorDanger: '#b91c1c',
                colorRing: '#4f46e533',
                colorModalBackdrop: '#0c0a0980',
                borderRadius: '0.75rem',
                fontFamily: 'Inter, Arial, sans-serif',
              },
              signIn: {
                elements: {
                  rootBox: { width: '100%' },
                  cardBox: { width: '100%', boxShadow: 'none', border: '0', backgroundColor: 'transparent' },
                  card: { width: '100%', boxShadow: 'none', border: '0', backgroundColor: 'transparent', padding: '0' },
                  footer: { marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'transparent' },
                },
              },
              signUp: {
                elements: {
                  rootBox: { width: '100%' },
                  cardBox: { width: '100%', boxShadow: 'none', border: '0', backgroundColor: 'transparent' },
                  card: { width: '100%', boxShadow: 'none', border: '0', backgroundColor: 'transparent', padding: '0' },
                  footer: { marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'transparent' },
                },
              },
              userProfile: {
                elements: {
                  rootBox: { width: '100%', maxWidth: '100%' },
                  cardBox: { width: '100%', maxWidth: '100%', boxShadow: 'none' },
                  card: { width: '100%', minWidth: '0', boxShadow: 'none' },
                  navbar: { flex: '0 0 11.5rem' },
                  profilePageContent: { minWidth: '0' },
                },
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
