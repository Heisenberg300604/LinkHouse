import { it, expect } from 'vitest';
import { Webhook } from 'svix';
import { verifyWebhook } from './webhook';
const secret = 'whsec_' + Buffer.from('unit-test-only-signing-secret').toString('base64');
it('rejects invalid signatures', () =>
  expect(() =>
    verifyWebhook(
      '{}',
      { 'svix-id': 'id', 'svix-timestamp': '1', 'svix-signature': 'bad' },
      secret,
    ),
  ).toThrow());
it('accepts authentic payloads', () => {
  const body = JSON.stringify({ type: 'user.deleted', data: { id: 'user_1' } });
  const date = new Date();
  const signature = new Webhook(secret).sign('msg_1', date, body);
  expect(
    verifyWebhook(
      body,
      {
        'svix-id': 'msg_1',
        'svix-timestamp': String(Math.floor(date.getTime() / 1000)),
        'svix-signature': signature,
      },
      secret,
    ),
  ).toEqual(JSON.parse(body));
});
