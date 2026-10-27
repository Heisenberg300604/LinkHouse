import { assertTestDatabase } from '@/lib/logic/database-safety';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  createLink,
  createSection,
  updateLink,
  deleteSection,
  reorderItems,
  publicProfile,
  seedDemo,
} from '@/lib/repository';
import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (url) assertTestDatabase(url, process.env.DATABASE_URL);
const db = new PrismaClient({ datasourceUrl: url });
describe.skipIf(!url)('real Postgres ownership and constraints', () => {
  let a: string, b: string;
  beforeEach(async () => {
    await db.$transaction([
      db.linkClick.deleteMany(),
      db.pageView.deleteMany(),
      db.link.deleteMany(),
      db.section.deleteMany(),
      db.user.deleteMany(),
    ]);
    a = (
      await db.user.create({ data: { clerkId: 'a', email: 'a@example.com', username: 'alice' } })
    ).id;
    b = (await db.user.create({ data: { clerkId: 'b', email: 'b@example.com', username: 'bob' } }))
      .id;
  });
  afterAll(() => db.$disconnect());
  it('creates normalized links only for the owner', async () => {
    const link = await createLink(a, { title: 'Site', url: 'example.com' }, db);
    expect(link.url).toBe('https://example.com/');
    await expect(updateLink(b, link.id, { title: 'Stolen' }, db)).rejects.toThrow();
  });
  it('rejects assignment to another owner section', async () => {
    const section = await createSection(a, { title: 'Private' }, db);
    await expect(
      createLink(b, { title: 'Site', url: 'example.com', sectionId: section.id }, db),
    ).rejects.toThrow();
  });
  it('rejects foreign and incomplete reorder lists', async () => {
    const link = await createLink(a, { title: 'Site', url: 'example.com' }, db);
    await expect(reorderItems(b, 'links', [link.id], null, db)).rejects.toThrow();
    await expect(reorderItems(a, 'links', [], null, db)).rejects.toThrow();
  });
  it('keeps links ungrouped on section removal', async () => {
    const section = await createSection(a, { title: 'Social' }, db);
    const link = await createLink(
      a,
      { title: 'Site', url: 'example.com', sectionId: section.id },
      db,
    );
    await deleteSection(a, section.id, false, db);
    expect((await db.link.findUniqueOrThrow({ where: { id: link.id } })).sectionId).toBeNull();
  });
  it('deletes links and clicks when requested', async () => {
    const section = await createSection(a, { title: 'Social' }, db);
    const link = await createLink(
      a,
      { title: 'Site', url: 'example.com', sectionId: section.id },
      db,
    );
    await db.linkClick.create({ data: { linkId: link.id } });
    await deleteSection(a, section.id, true, db);
    expect(await db.linkClick.count()).toBe(0);
    expect(await db.link.count()).toBe(0);
  });
  it('never returns hidden links or hidden sections', async () => {
    const section = await createSection(a, { title: 'Hidden' }, db);
    await createLink(a, { title: 'Invisible', url: 'example.com', sectionId: section.id }, db);
    await db.section.update({ where: { id: section.id }, data: { isVisible: false } });
    expect((await publicProfile('alice', db))?.links).toEqual([]);
    expect((await publicProfile('alice', db))?.sections).toEqual([]);
  });
  it('returns null for unknown username', async () =>
    expect(await publicProfile('unknown', db)).toBeNull());
  it('enforces 200 links and 30 sections', async () => {
    await db.link.createMany({
      data: Array.from({ length: 200 }, () => ({
        userId: a,
        title: 'Link',
        url: 'https://example.com',
      })),
    });
    await expect(createLink(a, { title: 'Overflow', url: 'example.com' }, db)).rejects.toThrow(
      '200',
    );
    await db.section.createMany({
      data: Array.from({ length: 30 }, () => ({ userId: a, title: 'Section' })),
    });
    await expect(createSection(a, { title: 'Overflow' }, db)).rejects.toThrow('30');
  });
  it('cascades account deletion', async () => {
    await createSection(a, { title: 'Social' }, db);
    const link = await createLink(a, { title: 'Site', url: 'example.com' }, db);
    await db.linkClick.create({ data: { linkId: link.id } });
    await db.pageView.create({ data: { userId: a } });
    await db.user.delete({ where: { id: a } });
    expect(await db.link.count()).toBe(0);
    expect(await db.section.count()).toBe(0);
    expect(await db.linkClick.count()).toBe(0);
    expect(await db.pageView.count()).toBe(0);
  });
  it('seeds idempotently', async () => {
    await seedDemo(db);
    await seedDemo(db);
    expect(await db.user.count({ where: { username: 'demo' } })).toBe(1);
    expect(await db.section.count({ where: { user: { username: 'demo' } } })).toBe(2);
    expect(await db.link.count({ where: { user: { username: 'demo' } } })).toBe(6);
  });
});
