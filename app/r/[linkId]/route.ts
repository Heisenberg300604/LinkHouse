import { after } from 'next/server';
import { db } from '@/lib/db';
import { normalizeUrl } from '@/lib/logic/core';
export async function GET(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  if (!process.env.DATABASE_URL) return new Response('Database not configured', { status: 503 });
  const link = await db.link.findFirst({
    where: {
      id: (await params).linkId,
      isVisible: true,
      OR: [{ sectionId: null }, { section: { isVisible: true } }],
    },
  });
  if (!link) return new Response('Link not found', { status: 404 });
  let referrerHost: string | null = null;
  try {
    referrerHost = new URL(request.headers.get('referer') ?? '').hostname;
  } catch {}
  after(async () => {
    try {
      await db.linkClick.create({ data: { linkId: link.id, referrerHost } });
    } catch {
      console.error('Click could not be recorded');
    }
  });
  return Response.redirect(normalizeUrl(link.url), 302);
}
