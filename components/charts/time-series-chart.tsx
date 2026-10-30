'use client';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { DayPoint } from '@/lib/logic/analytics';

const HEIGHT = 232;
const MARGIN = { top: 12, right: 8, bottom: 26, left: 34 };

const formatDay = (date: string, long = false) =>
  new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(long ? { weekday: 'short' } : {}),
    timeZone: 'UTC',
  });

/** Round a maximum up to a tidy axis value (1, 2, 5, 10, 20, 50 …). */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) if (step * magnitude >= value) return step * magnitude;
  return 10 * magnitude;
}

const series = [
  { key: 'clicks', label: 'Link clicks', color: 'var(--chart-clicks)' },
  { key: 'views', label: 'Page views', color: 'var(--chart-views)' },
] as const;

/**
 * Responsive line chart of daily views and clicks. Drawn at real pixel size (not a scaled
 * viewBox) so labels stay readable on phones. Supports pointer, touch and arrow-key inspection.
 */
export function TimeSeriesChart({ points, label }: { points: DayPoint[]; label: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
    const max = niceMax(Math.max(0, ...points.flatMap((p) => [p.views, p.clicks])));
    const x = (i: number) =>
      MARGIN.left + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2);
    const y = (v: number) => MARGIN.top + innerH - (v / max) * innerH;
    const path = (key: 'views' | 'clicks') =>
      points
        .map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[key]).toFixed(1))
        .join(' ');
    const base = MARGIN.top + innerH;
    const area = (key: 'views' | 'clicks') =>
      path(key) + ` L${x(points.length - 1).toFixed(1)} ${base} L${x(0).toFixed(1)} ${base} Z`;
    const every = Math.max(1, Math.ceil(points.length / Math.floor(innerW / 76)));
    return { innerW, innerH, max, x, y, path, area, every, base };
  }, [points, width]);

  const move = (event: PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setActive(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
  };
  const keys = (event: KeyboardEvent) => {
    const last = points.length - 1;
    const map: Record<string, number | null> = {
      ArrowLeft: Math.max(0, (active ?? last + 1) - 1),
      ArrowRight: Math.min(last, (active ?? -1) + 1),
      Home: 0,
      End: last,
      Escape: null,
    };
    if (event.key in map) {
      event.preventDefault();
      setActive(map[event.key]);
    }
  };

  const ticks = [0, 1, 2, 3, 4].map((i) => (geometry.max / 4) * i);
  const current = active === null ? null : points[active];
  const tooltipLeft =
    active === null ? 0 : Math.min(Math.max(geometry.x(active) - 68, 0), Math.max(0, width - 140));

  return (
    <div>
      <div
        ref={wrapper}
        className="chart"
        tabIndex={0}
        role="group"
        aria-label={label + '. Use the left and right arrow keys to inspect each day.'}
        onKeyDown={keys}
        onBlur={() => setActive(null)}
      >
        <svg width="100%" height={HEIGHT} aria-hidden>
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={geometry.y(tick)}
                y2={geometry.y(tick)}
                style={{ stroke: 'var(--chart-grid)' }}
              />
              <text
                x={MARGIN.left - 8}
                y={geometry.y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="11"
                style={{ fill: 'var(--muted)' }}
              >
                {Number.isInteger(tick) ? tick : tick.toFixed(1)}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % geometry.every === 0 ? (
              <text
                key={p.date}
                x={geometry.x(i)}
                y={HEIGHT - 6}
                textAnchor={i === 0 ? 'start' : 'middle'}
                fontSize="11"
                style={{ fill: 'var(--muted)' }}
              >
                {formatDay(p.date)}
              </text>
            ) : null,
          )}
          <path d={geometry.area('views')} style={{ fill: 'var(--chart-views)', opacity: 0.09 }} />
          {series
            .slice()
            .reverse()
            .map((s) => (
              <path
                key={s.key}
                d={geometry.path(s.key)}
                fill="none"
                strokeWidth={s.key === 'clicks' ? 2.25 : 1.75}
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ stroke: s.color }}
              />
            ))}
          {active !== null && current && (
            <g>
              <line
                x1={geometry.x(active)}
                x2={geometry.x(active)}
                y1={MARGIN.top}
                y2={geometry.base}
                style={{ stroke: 'var(--border-strong)' }}
                strokeDasharray="3 3"
              />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={geometry.x(active)}
                  cy={geometry.y(current[s.key])}
                  r={4}
                  strokeWidth={2}
                  style={{ fill: 'var(--surface)', stroke: s.color }}
                />
              ))}
            </g>
          )}
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={geometry.innerW}
            height={geometry.innerH}
            fill="transparent"
            onPointerMove={move}
            onPointerDown={move}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
        {current && (
          <div className="chart-tooltip" style={{ left: tooltipLeft }} role="status">
            <strong>{formatDay(current.date, true)}</strong>
            {series.map((s) => (
              <div key={s.key}>
                <span>
                  <i
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      marginRight: 6,
                      background: s.color,
                    }}
                  />
                  {s.label}
                </span>
                <b className="num">{current[s.key]}</b>
              </div>
            ))}
          </div>
        )}
      </div>
      <details className="data-table-toggle">
        <summary>View as table</summary>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th className="num-col">Page views</th>
                <th className="num-col">Link clicks</th>
              </tr>
            </thead>
            <tbody>
              {points
                .slice()
                .reverse()
                .map((p) => (
                  <tr key={p.date}>
                    <td>{formatDay(p.date, true)}</td>
                    <td className="num-col num">{p.views}</td>
                    <td className="num-col num">{p.clicks}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="legend" aria-label="Legend">
      {series.map((s) => (
        <span key={s.key}>
          <i style={{ background: s.color }} aria-hidden />
          {s.label}
        </span>
      ))}
    </div>
  );
}
