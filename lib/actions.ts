'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getOrCreateCurrentUser, requireUser, deleteIdentity } from './auth';
import { db } from './db';
import * as repository from './repository';
import { usernameSchema, sectionSchema } from './logic/core';
const mutation = z.discriminatedUnion('type', [
  z.object({ type: z.literal('add-link'), data: z.unknown() }),
  z.object({ type: z.literal('edit-link'), id: z.string(), data: z.unknown() }),
  z.object({ type: z.literal('delete-link'), id: z.string() }),
  z.object({ type: z.literal('add-section'), data: z.unknown() }),
  z.object({
    type: z.literal('edit-section'),
    id: z.string(),
    data: sectionSchema.partial().extend({ isVisible: z.boolean().optional() }),
  }),
  z.object({ type: z.literal('delete-section'), id: z.string(), deleteLinks: z.boolean() }),
  z.object({
    type: z.literal('reorder'),
    kind: z.enum(['links', 'sections']),
    ids: z.array(z.string()).max(200),
    sectionId: z.string().nullable(),
  }),
  z.object({ type: z.literal('profile'), data: z.unknown() }),
]);
export async function mutate(input: unknown) {
  const user = await requireUser();
  try {
    const action = mutation.parse(input);
    switch (action.type) {
      case 'add-link':
        await repository.createLink(user.id, action.data);
        break;
      case 'edit-link':
        await repository.updateLink(user.id, action.id, action.data);
        break;
      case 'delete-link':
        await db.link.delete({ where: { id: action.id, userId: user.id } });
        break;
      case 'add-section':
        await repository.createSection(user.id, action.data);
        break;
      case 'edit-section':
        await db.section.update({ where: { id: action.id, userId: user.id }, data: action.data });
        break;
      case 'delete-section':
        await repository.deleteSection(user.id, action.id, action.deleteLinks);
        break;
      case 'reorder':
        await repository.reorderItems(user.id, action.kind, action.ids, action.sectionId);
        break;
      case 'profile':
        await repository.updateProfile(user.id, action.data);
        break;
    }
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/' + user.username);
    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof z.ZodError
          ? error.issues[0].message
          : error instanceof Error && error.message.startsWith('You can')
            ? error.message
            : 'Unable to save. The name may be taken, or the item is no longer available.',
    };
  }
}
export async function usernameAvailability(value: string) {
  await getOrCreateCurrentUser();
  const result = usernameSchema.safeParse(value);
  if (!result.success) return { available: false, message: result.error.issues[0].message };
  const user = await db.user.findUnique({ where: { username: value }, select: { id: true } });
  return {
    available: !user,
    message: user ? 'This username is taken' : 'This username is available',
  };
}
export async function onboard(value: string) {
  const user = await getOrCreateCurrentUser();
  const parsed = usernameSchema.safeParse(value);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await db.user.update({ where: { id: user.id }, data: { username: parsed.data } });
  } catch {
    return { error: 'This username is taken' };
  }
  redirect('/dashboard');
}
export async function deleteAccount() {
  const user = await requireUser();
  await deleteIdentity(user.clerkId);
  await db.user.deleteMany({ where: { id: user.id } });
  redirect('/sign-up');
}
