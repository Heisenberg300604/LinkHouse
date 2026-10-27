export function assertTestDatabase(testUrl: string, devUrl?: string) {
  const canonical = (value: string) => {
    const u = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(u.protocol))
      throw new Error('Only Postgres test databases are supported');
    return u.hostname.replace('-pooler', '') + ':' + (u.port || '5432') + u.pathname;
  };
  if (canonical(testUrl) === (devUrl ? canonical(devUrl) : ''))
    throw new Error('Test database must differ from development database');
}
