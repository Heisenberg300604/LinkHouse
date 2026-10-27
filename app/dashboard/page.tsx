import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardEditor } from '@/features/dashboard';
export default async function Page() {
  const user = await requireUser();
  const [links, sections] = await Promise.all([
    db.link.findMany({ where: { userId: user.id }, orderBy: { position: 'asc' } }),
    db.section.findMany({ where: { userId: user.id }, orderBy: { position: 'asc' } }),
  ]);
  return <DashboardEditor user={user} links={links} sections={sections} />;
}
