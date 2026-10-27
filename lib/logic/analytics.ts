export function aggregateAnalytics(
  views: { createdAt: Date }[],
  clicks: { linkId: string; createdAt: Date }[],
  now = new Date(),
) {
  const cutoff = now.getTime() - 30 * 86400000;
  const within = (item: { createdAt: Date }) =>
    item.createdAt.getTime() >= cutoff && item.createdAt <= now;
  const recent = clicks.filter(within),
    byLink: Record<string, number> = {};
  for (const click of recent) byLink[click.linkId] = (byLink[click.linkId] ?? 0) + 1;
  return { views: views.filter(within).length, clicks: recent.length, byLink };
}
