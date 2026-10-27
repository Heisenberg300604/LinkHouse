import { z } from 'zod';
import { verifyWebhook } from '@/lib/logic/webhook';
import { db } from '@/lib/db';
const eventSchema = z.object({
  type: z.string(),
  data: z.object({
    id: z.string(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    image_url: z.string().optional(),
    primary_email_address_id: z.string().nullable().optional(),
    email_addresses: z.array(z.object({ id: z.string(), email_address: z.string() })).optional(),
  }),
});
export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) return new Response('Webhook not configured', { status: 503 });
  let event: z.infer<typeof eventSchema>;
  try {
    event = eventSchema.parse(
      verifyWebhook(await request.text(), Object.fromEntries(request.headers), secret),
    );
  } catch {
    return new Response('Invalid signature or payload', { status: 400 });
  }
  const { type, data } = event;
  if (type === 'user.deleted') await db.user.deleteMany({ where: { clerkId: data.id } });
  if (type === 'user.created' || type === 'user.updated') {
    const email =
      data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address ??
      '';
    await db.user.upsert({
      where: { clerkId: data.id },
      update: { email },
      create: {
        clerkId: data.id,
        email,
        displayName: [data.first_name, data.last_name].filter(Boolean).join(' '),
        avatarUrl: data.image_url ?? '',
      },
    });
  }
  return Response.json({ received: true });
}
