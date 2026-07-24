// OAuth 2.1 + PKCE plumbing for the MCP server (api/mcp*.js). Reuses
// lib/auth.js's passcode check and signing philosophy -- stateless
// HMAC-signed tokens, nothing stored server-side to look up or revoke --
// but generalizes the payload shape beyond auth.js's {exp}-only tokens,
// since an authorization code needs to carry the PKCE code_challenge and
// redirect_uri too. Single-user app: no per-client registry, no refresh
// tokens -- the access token's own 90-day expiry (matching auth.js's
// REMEMBER_MS) is the whole renewal story.
import crypto from 'crypto';
import { verifyPasscode } from './auth.js';

export { verifyPasscode };

const CODE_TTL_MS = 60 * 1000; // authorization code: single round trip, seconds matter, not days
const ACCESS_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function sign(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}

function verify(token) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  let expectedSig;
  try { expectedSig = crypto.createHmac('sha256', secret).update(body).digest('base64url'); }
  catch { return null; }
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  return payload;
}

export function issueAuthorizationCode({ codeChallenge, redirectUri, clientId }) {
  return sign({ type: 'code', codeChallenge, redirectUri, clientId, exp: Date.now() + CODE_TTL_MS });
}

export function verifyAuthorizationCode(code) {
  const payload = verify(code);
  return (payload && payload.type === 'code') ? payload : null;
}

export function issueAccessToken() {
  return sign({ type: 'access', exp: Date.now() + ACCESS_TOKEN_TTL_MS });
}

export function verifyAccessToken(token) {
  const payload = verify(token);
  return !!(payload && payload.type === 'access');
}

// RFC 7636 S256: the code_verifier the client presents at /token must hash
// to the code_challenge it sent at /authorize.
export function pkceMatches(codeVerifier, codeChallenge) {
  if (!codeVerifier || !codeChallenge) return false;
  let computed;
  try { computed = crypto.createHash('sha256').update(codeVerifier).digest('base64url'); }
  catch { return false; }
  const a = Buffer.from(computed);
  const b = Buffer.from(codeChallenge);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
