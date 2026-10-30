import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from './db';
export const getOrCreateCurrentUser = cache(async function getOrCreateCurrentUser() {
  if (!process.env.CLERK_SECRET_KEY) redirect('/sign-in');
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const existing = await db.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;
  const user = await currentUser();
  if (!user) redirect('/sign-in');
  return db.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email:
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? '',
      displayName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      avatarUrl: user.imageUrl,
    },
  });
});
export async function requireUser() {
  const user = await getOrCreateCurrentUser();
  if (!user.username) redirect('/onboarding');
  return user;
}
export async function deleteIdentity(clerkId: string) {
  await (await clerkClient()).users.deleteUser(clerkId);
}
export async function signedIn() {
  return process.env.CLERK_SECRET_KEY ? Boolean((await auth()).userId) : false;
}
