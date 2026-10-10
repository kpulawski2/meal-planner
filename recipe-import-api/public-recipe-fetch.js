import https from 'node:https';
import dns from 'node:dns/promises';
import net from 'node:net';

export function isPublicRecipeAddress(address) {
  if (net.isIPv4(address)) {
    const [a, b, c] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 || a === 100 && b >= 64 && b <= 127 || a === 198 && (b === 18 || b === 19) || a === 192 && b === 0 && c === 0);
  }
  if (net.isIPv6(address)) {
    const value = address.toLowerCase().split('%')[0];
    return !(value === '::' || value === '::1' || value.startsWith('fc') || value.startsWith('fd') || /^fe[89ab]/.test(value) || value.startsWith('::ffff:') || value.startsWith('ff'));
  }
  return false;
}
async function checkedUrl(value, resolveImpl, timeoutMs) {
  let url; try { url = new URL(value); } catch { throw new Error('Enter a valid full URL.'); }
  if (url.protocol !== 'https:') throw new Error('Only HTTPS recipe URLs are supported.');
  if (url.username || url.password) throw new Error('Recipe links must not contain usernames or passwords.');
  if (url.port && url.port !== '443') throw new Error('Recipe links must use the normal HTTPS port.');
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (net.isIP(host) || host === 'localhost' || /\.(?:localhost|local|internal)$/.test(host)) throw new Error('That recipe host is not allowed.');
  let records, timer;
  try {
    records = await Promise.race([resolveImpl(host, { all: true, verbatim: true }), new Promise((_resolve, reject) => { timer = setTimeout(() => reject(new Error('DNS timeout')), timeoutMs); })]);
  } catch { throw new Error('The recipe website could not be resolved.'); }
  finally { clearTimeout(timer); }
  if (!Array.isArray(records) || !records.length || records.some(record => !isPublicRecipeAddress(record.address))) throw new Error('That website resolves to a non-public address and cannot be fetched.');
  return { url, address: records.find(record => record.family === 4) || records[0] };
}
function readPinnedPage(url, address, { requestImpl, maxBytes, timeoutMs }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, result) => { if (settled) return; settled = true; error ? reject(error) : resolve(result); };
    const request = requestImpl(url, {
      method: 'GET', agent: false, signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'MealPlannerRecipeImporter/1.0 (+personal recipe importer)', Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1' },
      // Keep TLS verification and Host tied to the requested hostname, but pin
      // the connection to the already-checked public address. A second DNS
      // answer cannot redirect an anonymous import into the private network.
      lookup(_host, options, callback) { options?.all ? callback(null, [address]) : callback(null, address.address, address.family); }
    }, response => {
      const status = response.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status)) {
        finish(null, { status, location: response.headers.location }); response.destroy(); return;
      }
      if (status < 200 || status >= 300) { finish(new Error(`The recipe website returned HTTP ${status}.`)); response.destroy(); return; }
      if (!/text\/html|application\/xhtml\+xml/i.test(String(response.headers['content-type'] || ''))) { finish(new Error('This link did not return a recipe webpage. Paste its recipe text instead.')); response.destroy(); return; }
      if (Number(response.headers['content-length']) > maxBytes) { finish(new Error('The source page is too large to process.')); response.destroy(); return; }
      let bytes = 0; const chunks = [];
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > maxBytes) { finish(new Error('The source page is too large to process.')); response.destroy(); return; }
        chunks.push(Buffer.from(chunk));
      });
      response.on('error', error => finish(new Error(error?.name === 'AbortError' ? 'The recipe website timed out. Paste its recipe text instead.' : 'The recipe webpage could not be downloaded.')));
      response.on('end', () => finish(null, { status, html: Buffer.concat(chunks).toString('utf8') }));
    });
    request.on('error', error => finish(new Error(error?.name === 'AbortError' ? 'The recipe website timed out. Paste its recipe text instead.' : 'The recipe webpage could not be downloaded.')));
    request.end();
  });
}
export async function fetchPublicRecipePage(startUrl, { resolveImpl = dns.lookup, requestImpl = https.request, maxBytes = 1500000, timeoutMs = 12000 } = {}) {
  let current = startUrl;
  for (let redirects = 0; redirects <= 4; redirects++) {
    const { url, address } = await checkedUrl(current, resolveImpl, timeoutMs);
    const response = await readPinnedPage(url, address, { requestImpl, maxBytes, timeoutMs });
    if (response.location) {
      if (redirects === 4) throw new Error('Too many redirects from the recipe website.');
      current = new URL(response.location, url).toString(); continue;
    }
    if (response.status >= 300 && response.status < 400) throw new Error('The source site returned a redirect without a destination.');
    return { html: response.html, finalUrl: url.toString() };
  }
  throw new Error('Unable to fetch the recipe webpage.');
}
