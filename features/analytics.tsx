import { ArrowDownRight, ArrowUpRight, BarChart3, Lightbulb, Minus } from 'lucide-react';
import { ChartLegend, TimeSeriesChart } from '@/components/charts/time-series-chart';
import { EmptyState } from '@/components/ui/empty-state';
import { rankLinks, type DayPoint, type Delta, type LinkStat } from '@/lib/logic/analytics';

function DeltaText({ delta, days }: { delta: Delta; days: number }) {
  if (delta.direction === 'none') return <p className="stat-delta">No activity yet</p>;
  const Icon =
    delta.direction === 'up' ? ArrowUpRight : delta.direction === 'down' ? ArrowDownRight : Minus;
  return (
    <p className="stat-delta">
      <span
        className={
          delta.direction === 'up' ? 'delta-up' : delta.direction === 'down' ? 'delta-down' : ''
        }
      >
        <Icon size={13} aria-hidden style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
        {delta.label}
      </span>
      <span>vs previous {days} days</span>
    </p>
  );
}

const formatDay = (date: string) =>
  new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

/**
 * The analytics dashboard. Presentational only: the real page feeds it measured data and the
 * public demo feeds it clearly labelled sample data.
 */
export function AnalyticsView({
  days,
  series,
  views,
  clicks,
  viewsDelta,
  clicksDelta,
  links,
  sample = false,
}: {
  days: number;
  series: DayPoint[];
  views: number;
  clicks: number;
  viewsDelta: Delta;
  clicksDelta: Delta;
  links: LinkStat[];
  sample?: boolean;
}) {
  const { total, top, unclicked } = rankLinks(links);
  const empty = views === 0 && clicks === 0;
  const busiest = series.reduce<DayPoint | null>(
    (best, point) => (point.views > (best?.views ?? 0) ? point : best),
    null,
  );
  const rate = views > 0 ? Math.round((clicks / views) * 1000) / 10 : null;
  const insights: string[] = [];
  if (top[0] && total > 0)
    insights.push(
      `“${top[0].title}” is your most clicked link: ${top[0].clicks} ${top[0].clicks === 1 ? 'click' : 'clicks'}, ${Math.round((top[0].clicks / total) * 100)}% of all clicks.`,
    );
  if (busiest && busiest.views > 0)
    insights.push(
      `Your busiest day was ${formatDay(busiest.date)} with ${busiest.views} page ${busiest.views === 1 ? 'view' : 'views'}.`,
    );
  if (links.length > 0 && unclicked.length > 0 && !empty)
    insights.push(
      `${unclicked.length} of ${links.length} ${links.length === 1 ? 'link' : 'links'} had no clicks in this period.`,
    );

  return (
    <>
      <div className="stat-grid">
        <div className="card stat">
          <p className="stat-label">Page views</p>
          <strong className="stat-value num">{views.toLocaleString('en-US')}</strong>
          <DeltaText delta={viewsDelta} days={days} />
        </div>
        <div className="card stat">
          <p className="stat-label">Link clicks</p>
          <strong className="stat-value num">{clicks.toLocaleString('en-US')}</strong>
          <DeltaText delta={clicksDelta} days={days} />
        </div>
        <div className="card stat">
          <p className="stat-label">Clicks per view</p>
          <strong className="stat-value num">{rate === null ? '—' : rate + '%'}</strong>
          <p className="stat-delta">
            {rate === null
              ? 'Needs at least one page view'
              : views < 20
                ? 'Based on very few views'
                : 'Link clicks ÷ page views'}
          </p>
        </div>
      </div>

      <div className="analytics-grid">
        <section className="card" aria-labelledby="activity-title">
          <div className="card-header">
            <div>
              <h2 id="activity-title">Activity</h2>
              <p>
                Daily page views and link clicks, last {days} days
                {sample ? ' (sample data)' : ' (UTC)'}.
              </p>
            </div>
            {!empty && <ChartLegend />}
          </div>
          <div className="card-body">
            {empty ? (
              <div className="chart-empty">
                <EmptyState
                  icon={<BarChart3 size={22} />}
                  title={`No activity in the last ${days} days`}
                >
                  Share your page address. Views and clicks appear here as people visit.
                </EmptyState>
              </div>
            ) : (
              <TimeSeriesChart
                points={series}
                label={`Daily page views and link clicks over the last ${days} days. ${views} views and ${clicks} clicks in total`}
              />
            )}
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          <section className="card" aria-labelledby="top-title">
            <div className="card-header">
              <div>
                <h2 id="top-title">Top links</h2>
                <p>Most clicked in this period.</p>
              </div>
            </div>
            {top.length ? (
              <ol className="rank-list">
                {top.slice(0, 6).map((link) => (
                  <li className="rank-item" key={link.id}>
                    <span className="rank-title">{link.title}</span>
                    <span className="rank-value num">{link.clicks}</span>
                    <span className="rank-bar" aria-hidden>
                      <span
                        style={{ width: Math.max(3, (link.clicks / top[0].clicks) * 100) + '%' }}
                      />
                    </span>
                    <p className="rank-sub truncate">{link.url}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="card-body">
                <p className="muted" style={{ margin: 0 }}>
                  {links.length
                    ? 'No link has been clicked in this period yet.'
                    : 'Add a link to start tracking clicks.'}
                </p>
              </div>
            )}
          </section>

          {insights.length > 0 && (
            <section className="card" aria-labelledby="insights-title">
              <div className="card-header">
                <div>
                  <h2 id="insights-title">Highlights</h2>
                </div>
              </div>
              <ul className="insights">
                {insights.map((text) => (
                  <li key={text}>
                    <Lightbulb size={16} aria-hidden />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <p className="footnote muted">
        {sample
          ? 'Sample data for illustration only. '
          : 'A page view is counted each time your public page loads, including repeat visits and your own. A click is counted when someone opens a link from your page. Clicks on deleted links are removed with the link. These numbers are plain counts and don’t include device, location or visitor identity. '}
        Days are shown in UTC.
      </p>
    </>
  );
}
