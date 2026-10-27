import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
export default async function Page() {
  const user = await requireUser(),
    since = new Date(new Date().getTime() - 30 * 86400000);
  const [views, links] = await Promise.all([
    db.pageView.count({ where: { userId: user.id, createdAt: { gte: since } } }),
    db.link.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        _count: { select: { clicks: { where: { createdAt: { gte: since } } } } },
      },
    }),
  ]);
  const clicks = links.reduce((total, link) => total + link._count.clicks, 0);
  return (
    <div className="narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE BIGGER PICTURE</p>
          <h1>Your analytics</h1>
          <p>A simple look at what connects. Last 30 days.</p>
        </div>
      </div>
      <div className="stats-grid">
        <div className="panel">
          <p>Page views</p>
          <strong>{views}</strong>
        </div>
        <div className="panel">
          <p>Link clicks</p>
          <strong>{clicks}</strong>
        </div>
      </div>
      <section className="panel">
        <h2>Clicks by link</h2>
        {links.length ? (
          <table>
            <thead>
              <tr>
                <th>Link</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td>{link.title}</td>
                  <td>{link._count.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Your first link is the start of the story. Add one to see its activity here.</p>
        )}
      </section>
    </div>
  );
}
