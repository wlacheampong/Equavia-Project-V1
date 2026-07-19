// Shared session-token logic for the 6.0 security gate. Not a route itself
// (lives outside api/) -- imported by api/auth-login.js and by every gated
// endpoint (api/chat.js, api/whoop-refresh.js, api/whoop-data.js,
// api/google-calendar-refresh.js).
//
// Single-passcode design (no per-device revocation, no database): the
// server holds one salted passcode hash (PASSCODE_HASH env var) and one
// signing secret (SESSION_SECRET env var). A correct passcode gets a
// stateless HMAC-signed token carrying only an expiry -- nothing to store,
// nothing to look up, nothing to revoke individually. That's the tradeoff
// this build explicitly chose over per-device tokens, which would need a
// real server-side store this project doesn't have.
import crypto from 'crypto';

// Fixed salt is fine here: there is exactly one passcode for the whole app,
// not one hash per user, so a per-user random salt buys nothing -- and this
// constant never leaves the server (api/lib code is never shipped to the
// client), so hardcoding it isn't exposing anything.
const PASSCODE_SALT = 'equavia-gate-v1';
const REMEMBER_MS = 90 * 24 * 60 * 60 * 1000; // "remember this device" -- 90 days, per spec
const SESSION_ONLY_MS = 12 * 60 * 60 * 1000;  // not remembered -- short-lived ceiling

// PBKDF2-SHA256, 210,000 rounds (OWASP's 2023 minimum), 64-byte output --
// not scrypt. Both are legitimate choices; PBKDF2 was picked specifically
// because it's the one that could actually be generated end-to-end without
// a Node runtime (no Node was available in the environment this was built
// in, and there was no guarantee the user has one either) -- PBKDF2 is
// implementable identically via .NET's Rfc2898DeriveBytes, which let the
// hash below actually get generated rather than handed off as a manual
// step. Scrypt's memory-hardness is a real advantage against GPU/ASIC
// cracking, but for a single-user app behind a rate-limited login endpoint
// with a human-chosen passcode, PBKDF2 at this iteration count is not a
// meaningful downgrade for this threat model.
const PBKDF2_ROUNDS = 210000;

function hashPasscode(passcode) {
  return crypto.pbkdf2Sync(String(passcode), PASSCODE_SALT, PBKDF2_ROUNDS, 64, 'sha256').toString('hex');
}

export function verifyPasscode(passcode) {
  const expected = process.env.PASSCODE_HASH;
  if (!expected || typeof passcode !== 'string' || !passcode) return false;
  let actual;
  try { actual = hashPasscode(passcode); } catch { return false; }
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function issueToken(remember) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const exp = Date.now() + (remember ? REMEMBER_MS : SESSION_ONLY_MS);
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return { token: payload + '.' + sig, exp };
}

export function verifyToken(token) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  let expectedSig;
  try { expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url'); }
  catch { return false; }
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return false; }
  return typeof data.exp === 'number' && Date.now() <= data.exp;
}

// Shared guard for gated endpoints: returns true and lets the caller
// proceed, or writes a 401 and returns false.
export function requireSession(req, res) {
  const token = req.headers['x-eq-session'];
  if (verifyToken(token)) return true;
  res.status(401).json({ error: 'sign in required' });
  return false;
}
