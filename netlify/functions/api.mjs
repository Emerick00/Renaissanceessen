import { getStore } from '@netlify/blobs';
import { makeHandler } from '../lib/handler.mjs';
import seed from '../lib/seed.mjs';

export const config = { path: '/api/*' };

export default async (req) => {
  const store = getStore({ name: 'foot', consistency: 'strong' });
  const password = (globalThis.Netlify && Netlify.env.get('ADMIN_PASSWORD')) || process.env.ADMIN_PASSWORD || '';
  return makeHandler({ store, password, seed })(req);
};
