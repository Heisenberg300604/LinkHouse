import { Prisma, PrismaClient } from '@prisma/client';
import { db } from './db';
import { checkLimit, linkSchema, sectionSchema, profileSchema } from './logic/core';
import { buildSeries, periodBounds, type LinkStat } from './logic/analytics';
type Tx = Prisma.TransactionClient;
async function lock(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}
export async function createLink(userId: string, input: unknown, client: PrismaClient = db) {
  const data = linkSchema.parse(input);
  return client.$transaction(async (tx) => {
    await lock(tx, userId);
    checkLimit(await tx.link.count({ where: { userId } }), 'links');
    if (data.sectionId)
      await tx.section.findFirstOrThrow({ where: { id: data.sectionId, userId } });
    const last = await tx.link.aggregate({
      where: { userId, sectionId: data.sectionId ?? null },
      _max: { position: true },
    });
    return tx.link.create({ data: { ...data, userId, position: (last._max.position ?? -1) + 1 } });
  });
}
export async function createSection(userId: string, input: unknown, client: PrismaClient = db) {
  const data = sectionSchema.parse(input);
  return client.$transaction(async (tx) => {
    await lock(tx, userId);
    checkLimit(await tx.section.count({ where: { userId } }), 'sections');
    const last = await tx.section.aggregate({ where: { userId }, _max: { position: true } });
    return tx.section.create({
      data: { ...data, userId, position: (last._max.position ?? -1) + 1 },
    });
  });
}
export async function updateLink(
  userId: string,
  id: string,
  input: unknown,
  client: PrismaClient = db,
) {
  const data = linkSchema
    .partial()
    .extend({ isVisible: (await import('zod')).z.boolean().optional() })
    .parse(input);
  return client.$transaction(async (tx) => {
    await lock(tx, userId);
    await tx.link.findFirstOrThrow({ where: { id, userId } });
    if (data.sectionId)
      await tx.section.findFirstOrThrow({ where: { id: data.sectionId, userId } });
    return tx.link.update({ where: { id, userId }, data });
  });
}
export async function deleteSection(
  userId: string,
  id: string,
  deleteLinks: boolean,
  client: PrismaClient = db,
) {
  return client.$transaction(async (tx) => {
    await lock(tx, userId);
    await tx.section.findFirstOrThrow({ where: { id, userId } });
    if (deleteLinks) await tx.link.deleteMany({ where: { sectionId: id, userId } });
    else
      await tx.link.updateMany({
        where: { sectionId: id, userId },
        data: { sectionId: null, position: -1 },
      });
    await tx.section.delete({ where: { id, userId } });
  });
}
export async function reorderItems(
  userId: string,
  kind: 'links' | 'sections',
  ids: string[],
  sectionId: string | null,
  client: PrismaClient = db,
) {
  return client.$transaction(async (tx) => {
    await lock(tx, userId);
    const rows =
      kind === 'links'
        ? await tx.link.findMany({ where: { userId, sectionId }, select: { id: true } })
        : await tx.section.findMany({ where: { userId }, select: { id: true } });
    if (
      new Set(ids).size !== ids.length ||
      rows.length !== ids.length ||
      rows.some((row) => !ids.includes(row.id))
    )
      throw new Error('Invalid order');
    for (const [position, id] of ids.entries()) {
      if (kind === 'links') await tx.link.update({ where: { id, userId }, data: { position } });
      else await tx.section.update({ where: { id, userId }, data: { position } });
    }
  });
}
export async function updateProfile(userId: string, input: unknown, client: PrismaClient = db) {
  return client.user.update({ where: { id: userId }, data: profileSchema.parse(input) });
}
export async function publicProfile(username: string, client: PrismaClient = db) {
  return client.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      links: {
        where: { isVisible: true, sectionId: null },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
      },
      sections: {
        where: { isVisible: true },
        orderBy: [{ position: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          title: true,
          links: { where: { isVisible: true }, orderBy: [{ position: 'asc' }, { id: 'asc' }] },
        },
      },
    },
  });
}
export async function seedDemo(client: PrismaClient = db) {
  return client.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { clerkId: 'seed_demo_user' },
      update: {},
      create: {
        clerkId: 'seed_demo_user',
        email: 'demo@example.com',
        username: 'demo',
        displayName: 'Alex Morgan',
        bio: 'Designer, maker, and curious human. A little corner of everything I create.',
      },
    });
    const groups = ['Social', 'Free Resources'];
    for (const [position, title] of groups.entries())
      await tx.section.upsert({
        where: { id: 'demo-section-' + position },
        update: {},
        create: { id: 'demo-section-' + position, userId: user.id, title, position },
      });
    const links = [
      ['My portfolio', 'https://example.com', null],
      ['Latest writing', 'https://example.com/journal', null],
      ['Instagram', 'https://instagram.com', 'demo-section-0'],
      ['GitHub', 'https://github.com', 'demo-section-0'],
      ['Design resources', 'https://www.figma.com/community', 'demo-section-1'],
      ['Learn to build', 'https://developer.mozilla.org', 'demo-section-1'],
    ];
    for (const [position, [title, url, sectionId]] of links.entries())
      await tx.link.upsert({
        where: { id: 'demo-link-' + position },
        update: {},
        create: {
          id: 'demo-link-' + position,
          userId: user.id,
          title: title!,
          url: url!,
          sectionId,
          position,
        },
      });
    return user;
  });
}

type DailyCount = { day: Date; count: number };

/**
 * Everything the analytics page shows, for the last `days` UTC days and the equal period before it.
 * Daily buckets are computed in SQL so cost stays flat as traffic grows; every query is scoped to `userId`.
 */
export async function analyticsReport(
  userId: string,
  days: number,
  now = new Date(),
  client: PrismaClient = db,
) {
  const { start, previousStart } = periodBounds(days, now);
  const [viewRows, clickRows, previousViews, previousClicks, links] = await Promise.all([
    client.$queryRaw<DailyCount[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "PageView"
      WHERE "userId" = ${userId} AND "createdAt" >= ${start} AND "createdAt" <= ${now}
      GROUP BY 1`,
    client.$queryRaw<DailyCount[]>`
      SELECT date_trunc('day', c."createdAt") AS day, COUNT(*)::int AS count
      FROM "LinkClick" c JOIN "Link" l ON l.id = c."linkId"
      WHERE l."userId" = ${userId} AND c."createdAt" >= ${start} AND c."createdAt" <= ${now}
      GROUP BY 1`,
    client.pageView.count({ where: { userId, createdAt: { gte: previousStart, lt: start } } }),
    client.linkClick.count({
      where: { link: { userId }, createdAt: { gte: previousStart, lt: start } },
    }),
    client.link.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        url: true,
        _count: { select: { clicks: { where: { createdAt: { gte: start, lte: now } } } } },
      },
    }),
  ]);
  const series = buildSeries(days, now, viewRows, clickRows);
  const linkStats: LinkStat[] = links.map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
    clicks: l._count.clicks,
  }));
  return {
    days,
    series,
    views: series.reduce((sum, p) => sum + p.views, 0),
    clicks: series.reduce((sum, p) => sum + p.clicks, 0),
    previousViews,
    previousClicks,
    links: linkStats,
  };
}
