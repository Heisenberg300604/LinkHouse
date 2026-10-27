import NextLink from 'next/link';
import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { publicProfile } from '@/lib/repository';
import { db } from '@/lib/db';
import { PublicProfile } from '@/features/dashboard';
import { ThemeToggle } from '@/components/providers';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ username: string }> };
export async function generateMetadata({ params }: Props) {
  if (!process.env.DATABASE_URL) return { title: 'Profile unavailable' };
  const user = await publicProfile((await params).username);
  return user
    ? {
        title: user.displayName,
        description: user.bio,
        openGraph: {
          title: user.displayName,
          description: user.bio,
          ...(user.avatarUrl ? { images: [user.avatarUrl] } : {}),
        },
      }
    : { title: 'Page not found' };
}
export default async function Page({ params }: Props) {
  if (!process.env.DATABASE_URL)
    return (
      <main className="auth-page">
        <div className="panel">
          <h1>Your page is almost ready.</h1>
          <p>Configure Neon and run the migrations and seed to load public profiles.</p>
          <NextLink href="/">Back to Linkhouse</NextLink>
        </div>
      </main>
    );
  const user = await publicProfile((await params).username);
  if (!user) notFound();
  after(async () => {
    try {
      await db.pageView.create({ data: { userId: user.id } });
    } catch {
      console.error('Page view could not be recorded');
    }
  });
  return (
    <main className="public-page">
      <div className="public-theme">
        <ThemeToggle />
      </div>
      <PublicProfile
        user={user}
        links={[...user.links, ...user.sections.flatMap((s) => s.links)]}
        sections={user.sections}
      />
    </main>
  );
}
