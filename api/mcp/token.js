// OAuth token endpoint -- exchanges the /authorize code for an access
// token, after verifying the PKCE code_verifier matches the code_challenge
// that was embedded in the (signed, single-use-window) code. No refresh
// tokens: the access token's own 90-day expiry is the whole renewal story
// for this single-user app.
import { verifyAuthorizationCode, pkceMatches, issueAccessToken } from '../../lib/mcp-auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { try { body = Object.fromEntries(new URLSearchParams(body)); } catch { body = {}; } }
  }
  body = body || {};

  const { grant_type, code, redirect_uri, code_verifier } = body;
  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }

  const payload = verifyAuthorizationCode(code);
  if (!payload) return res.status(400).json({ error: 'invalid_grant', error_description: 'code expired or invalid' });
  if (payload.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
  }
  if (!pkceMatches(code_verifier, payload.codeChallenge)) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
  }

  const accessToken = issueAccessToken();
  if (!accessToken) return res.status(500).json({ error: 'server_error' });
  return res.status(200).json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 90 * 24 * 60 * 60,
  });
}
