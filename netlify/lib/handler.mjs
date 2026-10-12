// Logique de l'API (identique au serveur Docker) : lecture publique, écriture réservée à l'administrateur.
import crypto from 'node:crypto';

const MAX_BODY = 1024 * 1024;
const SESSION_MS = 30 * 24 * 3600 * 1000;
const EMPTY = { matches: [], awards: {}, fines: [] };

const sha = (x) => crypto.createHash('sha256').update(String(x)).digest();
const safeEq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };

function clean(s) {
  const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  if (!obj(s) || !Array.isArray(s.matches) || !Array.isArray(s.fines) || !obj(s.awards)) throw new Error('format');
  if (!s.matches.every(obj) || !s.fines.every(obj)) throw new Error('format');
  return { matches: s.matches, awards: s.awards, fines: s.fines };
}

export function makeHandler({ store, password, seed = EMPTY }) {
  const secret = sha('foot-secret|' + password);
  const sign = (exp) => crypto.createHmac('sha256', secret).update(String(exp)).digest('hex');
  const attempts = new Map();

  const json = (code, obj, headers = {}) =>
    new Response(JSON.stringify(obj), { status: code, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });

  const cookies = (req) => {
    const o = {};
    (req.headers.get('cookie') || '').split(';').forEach((p) => {
      const i = p.indexOf('=');
      if (i > 0) { try { o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch (_) {} }
    });
    return o;
  };
  const isAdmin = (req) => {
    const t = cookies(req).fd_admin;
    if (!t) return false;
    const [exp, sig] = t.split('.');
    return !!(exp && sig && +exp > Date.now() && safeEq(sig, sign(exp)));
  };
  const cookie = (value, maxAge) => 'fd_admin=' + encodeURIComponent(value) + '; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=' + maxAge;
  const isJson = (req) => String(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json');

  async function current() {
    const d = await store.get('state', { type: 'json' });
    return d || { rev: 0, updated: null, state: seed };
  }

  return async function handle(req) {
    const path = new URL(req.url).pathname;
    const m = req.method;
    try {
      if (path === '/api/state' && m === 'GET') {
        const d = await current();
        return json(200, { rev: d.rev, updated: d.updated, state: d.state });
      }
      if (path === '/api/state' && m === 'PUT') {
        if (!password) return json(500, { error: 'ADMIN_PASSWORD non défini sur Netlify' });
        if (!isAdmin(req)) return json(401, { error: 'non autorisé' });
        if (!isJson(req)) return json(415, { error: 'JSON requis' });
        const raw = await req.text();
        if (raw.length > MAX_BODY) return json(413, { error: 'trop gros' });
        let state;
        try { state = clean(JSON.parse(raw)); } catch (_) { return json(400, { error: 'format invalide' }); }
        const old = await current();
        if (old.rev > 0) await store.setJSON('state-prev', old);
        const d = { rev: old.rev + 1, updated: new Date().toISOString(), state };
        await store.setJSON('state', d);
        return json(200, { rev: d.rev });
      }
      if (path === '/api/me' && m === 'GET') return json(200, { admin: !!password && isAdmin(req) });
      if (path === '/api/login' && m === 'POST') {
        if (!password) return json(500, { error: 'ADMIN_PASSWORD non défini sur Netlify' });
        if (!isJson(req)) return json(415, { error: 'JSON requis' });
        const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '?';
        const now = Date.now(), a = attempts.get(ip);
        if (!a || a.reset < now) attempts.set(ip, { n: 1, reset: now + 10 * 60 * 1000 });
        else if (++a.n > 10) return json(429, { error: 'trop de tentatives' });
        let pw = '';
        try { pw = String(JSON.parse(await req.text()).password || ''); } catch (_) {}
        if (!crypto.timingSafeEqual(sha(pw), sha(password))) {
          await new Promise((r) => setTimeout(r, 400));
          return json(401, { error: 'mot de passe incorrect' });
        }
        const exp = Date.now() + SESSION_MS;
        return json(200, { ok: true }, { 'Set-Cookie': cookie(exp + '.' + sign(exp), Math.floor(SESSION_MS / 1000)) });
      }
      if (path === '/api/logout' && m === 'POST') return json(200, { ok: true }, { 'Set-Cookie': cookie('', 0) });
      return json(404, { error: 'introuvable' });
    } catch (e) {
      console.error(e);
      return json(500, { error: 'erreur serveur' });
    }
  };
}
