import { Webhook } from 'svix';
export function verifyWebhook(
  body: string,
  headers: Record<string, string>,
  secret: string,
): unknown {
  new Webhook(secret).verify(body, headers);
  return JSON.parse(body);
}
