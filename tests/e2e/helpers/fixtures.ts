import { PrismaClient } from '@prisma/client';
import { createClerkClient } from '@clerk/nextjs/server';
import { assertTestDatabase } from '../../../lib/logic/database-safety';
import { seedDemo } from '../../../lib/repository';
export async function fixtureDb() {
  assertTestDatabase(process.env.TEST_DATABASE_URL!, process.env.DATABASE_URL);
  return new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
}
export async function resetFixtures() {
  const db = await fixtureDb();
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  try {
    for (const [index, key] of ['E2E_CLERK_USER_USERNAME', 'E2E_CLERK_USER_B_USERNAME'].entries()) {
      const identifier = process.env[key]!;
      const found = await clerk.users.getUserList(
        identifier.includes('@') ? { emailAddress: [identifier] } : { username: [identifier] },
      );
      const identity = found.data[0];
      if (!identity) throw new Error('Configured Clerk test user does not exist');
      const user = await db.user.upsert({
        where: { clerkId: identity.id },
        update: { username: index ? 'e2e-bob' : 'e2e-alice', displayName: 'E2E Creator', bio: '' },
        create: {
          clerkId: identity.id,
          email: 'e2e@example.com',
          username: index ? 'e2e-bob' : 'e2e-alice',
          displayName: 'E2E Creator',
        },
      });
      await db.$transaction([
        db.link.deleteMany({ where: { userId: user.id } }),
        db.section.deleteMany({ where: { userId: user.id } }),
        db.pageView.deleteMany({ where: { userId: user.id } }),
      ]);
      if (index === 0)
        await db.link.create({
          data: {
            id: 'e2e-private-sentinel',
            userId: user.id,
            title: 'E2E private sentinel',
            url: 'https://example.com',
            isVisible: false,
          },
        });
    }
    await seedDemo(db);
  } finally {
    await db.$disconnect();
  }
}
