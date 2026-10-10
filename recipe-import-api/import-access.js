import crypto from 'node:crypto';

function validToken(supplied, expected) {
  if (!expected || typeof supplied !== 'string') return false;
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function isSameOriginImport(req) {
  const expected = `${req.protocol}://${req.get('host')}`;
  const origin = req.get('origin');
  if (origin) return origin === expected;
  if (req.get('sec-fetch-site') === 'same-origin') return true;
  try { return new URL(req.get('referer')).origin === expected; } catch { return false; }
}
export function createImportAccess({ token = '', windowMs = 600000, limit = 6, now = Date.now } = {}) {
  const clients = new Map();
  return (req, res, next) => {
    if (!validToken(req.get('x-import-token'), token) && !isSameOriginImport(req)) {
      return res.status(401).json({ error: 'Open the Meal Planner and import the recipe from its Recipes page. No access token is needed there.' });
    }
    const time = now();
    // Periodically discard inactive clients; anonymous imports must not grow an
    // unbounded in-memory IP map on Render's free service.
    for (const [key, hits] of clients) if (!hits.length || time - hits.at(-1) >= windowMs) clients.delete(key);
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const recent = (clients.get(key) || []).filter(at => time - at < windowMs);
    if (recent.length >= limit) {
      const retry = Math.max(1, Math.ceil((recent[0] + windowMs - time) / 1000));
      return res.set('Retry-After', String(retry)).status(429).json({ error: 'You have imported several recipes recently. Please wait a few minutes before trying again. Your recipes are safe.', retryAfterSeconds: retry });
    }
    if (clients.size >= 5000 && !clients.has(key)) return res.set('Retry-After', '60').status(503).json({ error: 'Recipe importing is busy. Please retry in a minute.' });
    recent.push(time); clients.set(key, recent);
    next();
  };
}

export class ImportLimitError extends Error {
  constructor(message, status = 429, retryAfterSeconds = 60) {
    super(message); this.status = status; this.retryAfterSeconds = retryAfterSeconds;
  }
}
export function createAiImportBudget({ dailyLimit = 20, minIntervalMs = 60000, now = Date.now } = {}) {
  let day = '', used = 0, busy = false, lastStarted = -Infinity;
  return () => {
    const time = now(), today = new Date(time).toISOString().slice(0, 10);
    if (today !== day) { day = today; used = 0; }
    if (busy) throw new ImportLimitError('Another video or AI recipe import is being processed. Structured recipe websites and pasted ingredient lists still work; please retry this import shortly.', 503, 15);
    if (used >= dailyLimit) throw new ImportLimitError('The free daily video/AI import allowance has been used. Recipe websites with structured ingredients and pasted recipe lists still work without AI. Try video import again tomorrow.', 429, Math.max(60, Math.ceil((Date.parse(`${today}T00:00:00Z`) + 86400000 - time) / 1000)));
    if (time - lastStarted < minIntervalMs) throw new ImportLimitError('Please wait a minute between video/AI imports to stay within the free service allowance. Structured recipe pages and pasted ingredient lists can still be imported.', 429, Math.ceil((lastStarted + minIntervalMs - time) / 1000));
    used++; busy = true; lastStarted = time;
    let released = false;
    return () => { if (!released) { busy = false; released = true; } };
  };
}
