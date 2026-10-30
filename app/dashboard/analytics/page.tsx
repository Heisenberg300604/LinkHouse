import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { analyticsReport } from '@/lib/repository';
import { RANGES, compareDelta, parseRange } from '@/lib/logic/analytics';
import { PageHeader } from '@/components/ui/page-header';
import { AnalyticsView } from '@/features/analytics';

export const metadata = { title: 'Analytics' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const days = parseRange((await searchParams).range);
  const report = await analyticsReport(user.id, days);
  return (
    <>
      <PageHeader
        title="Analytics"
        description="How people interact with your page and links."
        actions={
          <nav className="segmented" aria-label="Time range">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={range === 30 ? '/dashboard/analytics' : '/dashboard/analytics?range=' + range}
                aria-current={range === days ? 'true' : undefined}
                scroll={false}
              >
                {range} days
              </Link>
            ))}
          </nav>
        }
      />
      <AnalyticsView
        days={days}
        series={report.series}
        views={report.views}
        clicks={report.clicks}
        viewsDelta={compareDelta(report.views, report.previousViews)}
        clicksDelta={compareDelta(report.clicks, report.previousClicks)}
        links={report.links}
      />
    </>
  );
}
