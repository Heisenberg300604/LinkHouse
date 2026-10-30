import { redirect } from 'next/navigation';
import { getOrCreateCurrentUser } from '@/lib/auth';
import { onboard, usernameAvailability } from '@/lib/actions';
import { OnboardingForm } from '@/features/editor';
import { AuthShell } from '@/components/auth-shell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Choose your address' };

export default async function Page() {
  const user = await getOrCreateCurrentUser();
  if (user.username) redirect('/dashboard');
  return (
    <AuthShell
      eyebrow="One last step"
      title="Choose your address"
      description="This is the web address of your page. You can change it later from your profile."
    >
      <OnboardingForm check={usernameAvailability} submit={onboard} />
    </AuthShell>
  );
}
