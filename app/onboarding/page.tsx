import NextLink from 'next/link';
import { redirect } from 'next/navigation';
import { getOrCreateCurrentUser } from '@/lib/auth';
import { onboard, usernameAvailability } from '@/lib/actions';
import { OnboardingForm } from '@/features/editor';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await getOrCreateCurrentUser();
  if (user.username) redirect('/dashboard');
  return (
    <main className="auth-page">
      <NextLink href="/" className="wordmark">
        linkhouse.
      </NextLink>
      <section className="panel">
        <p className="eyebrow">A PLACE TO CALL YOURS</p>
        <h1>Choose your address.</h1>
        <p>One name. Everything you share.</p>
        <OnboardingForm check={usernameAvailability} submit={onboard} />
      </section>
    </main>
  );
}
