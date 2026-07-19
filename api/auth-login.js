// 6.0 Security Gate -- passcode login. Verifies the submitted passcode
// against PASSCODE_HASH and, on success, issues a stateless signed session
// token (see lib/auth.js for why this needs no database). Never logs or
// echoes the passcode itself.
import { verifyPasscode, issueToken } from '../lib/auth.js';

// Best-effort only, same caveat as api/chat.js's limiter: a warm instance
// isn't guaranteed to be the only one handling traffic. Enough to slow a
// casual brute-force attempt against a single-user app, not a real defense.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 5 * 60000;
let hits = [];
function withinRateLimit() {
  const now = Date.now();
  hits = hits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) return false;
  hits.push(now);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  if (!withinRateLimit()) {
    return res.status(429).json({ error: 'Too many attempts -- wait a few minutes and try again.' });
  }

  if (!process.env.PASSCODE_HASH || !process.env.SESSION_SECRET) {
    return res.status(500).json({ error: 'server not configured (missing PASSCODE_HASH or SESSION_SECRET)' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  if (!verifyPasscode(body && body.passcode)) {
    return res.status(401).json({ error: 'incorrect passcode' });
  }

  const remember = !!(body && body.remember);
  const issued = issueToken(remember);
  if (!issued) return res.status(500).json({ error: 'could not issue session' });
  return res.status(200).json({ token: issued.token, exp: issued.exp });
}
