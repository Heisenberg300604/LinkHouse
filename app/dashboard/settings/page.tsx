import { Settings } from '@/features/dashboard';
import { PageHeader } from '@/components/ui/page-header';

export const metadata = { title: 'Settings' };

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" description="Appearance, sign-in and security, and your data." />
      <Settings />
    </>
  );
}
