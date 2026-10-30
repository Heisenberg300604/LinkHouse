import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { DashboardEditor } from '@/features/dashboard';

export default async function Page() {
  const user = await requireUser();
  const since = new Date(new Date().getTime() - 30 * 86400000);
  const [links, sections] = await Promise.all([
    db.link.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' },
      include: { _count: { select: { clicks: { where: { createdAt: { gte: since } } } } } },
    }),
    db.section.findMany({ where: { userId: user.id }, orderBy: { position: 'asc' } }),
  ]);
  const clicks = Object.fromEntries(links.map((l) => [l.id, l._count.clicks]));
  return <DashboardEditor user={user} links={links} sections={sections} clicks={clicks} />;
}
