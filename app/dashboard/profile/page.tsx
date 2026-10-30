import { requireUser } from '@/lib/auth';
import { publicProfile } from '@/lib/repository';
import { PageHeader } from '@/components/ui/page-header';
import { ProfileEditor } from '@/features/dashboard';

export const metadata = { title: 'Profile' };

export default async function Page() {
  const user = await requireUser();
  const page = await publicProfile(user.username!);
  return (
    <>
      <PageHeader title="Profile" description="How you appear to everyone who visits your page." />
      <ProfileEditor
        user={user}
        links={page ? [...page.links, ...page.sections.flatMap((s) => s.links)] : []}
        sections={page?.sections ?? []}
      />
    </>
  );
}
