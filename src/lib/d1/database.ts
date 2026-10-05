import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';

export async function getD1Database(): Promise<D1Database> {
  const { env } = (await getCloudflareContext({ async: true })) as {
    env: { DB?: D1Database };
  };

  if (!env.DB) {
    throw new Error('Cloudflare D1 binding "DB" is not configured');
  }

  return env.DB;
}
