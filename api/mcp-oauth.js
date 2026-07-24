// Combines the well-known metadata, authorize, token, and register
// endpoints into ONE function. Vercel's Hobby plan caps a deployment at 12
// serverless functions total -- four separate small OAuth-flow endpoints
// weren't worth spending 4 of that budget on when they can cleanly branch
// on an `action` param instead. vercel.json rewrites the public-facing URLs
// (/.well-known/oauth-authorization-server, /api/mcp/authorize,
// /api/mcp/token, /api/mcp/register -- unchanged from Claude's point of
// view) to this one file with ?action=... appended.
import crypto from 'crypto';
import { verifyPasscode, issueAuthorizationCode, verifyAuthorizationCode, pkceMatches, issueAccessToken } from '../lib/mcp-auth.js';

function resolveAction(req) {
  if (req.query && req.query.action) return req.query.action;
  // Fallback in case a rewrite's destination query ever doesn't merge with
  // the original request's -- infer from the path suffix instead.
  const path = (req.url || '').split('?')[0];
  if (path.endsWith('/authorize')) return 'authorize';
  if (path.endsWith('/token')) return 'token';
  if (path.endsWith('/register')) return 'register';
  if (path.endsWith('/oauth-authorization-server')) return 'metadata';
  return null;
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderForm({ clientId, redirectUri, state, codeChallenge, codeChallengeMethod, error }) {
  return '<!doctype html><html><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<title>Connect to Equavia</title><style>'
    + 'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0b;color:#fafafa;'
    + 'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}'
    + 'form{background:#151517;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;width:100%;max-width:340px;box-sizing:border-box;}'
    + 'h1{font-size:18px;margin:0 0 6px;}'
    + 'p{color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 20px;}'
    + 'input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);'
    + 'background:rgba(255,255,255,0.05);color:#fafafa;font-size:15px;margin-bottom:14px;}'
    + 'button{width:100%;padding:12px;border-radius:10px;border:none;background:#E07658;color:#1a0f0a;font-weight:700;font-size:15px;cursor:pointer;}'
    + '.err{color:#ef4444;font-size:13px;margin:-6px 0 14px;}'
    + '</style></head><body>'
    + '<form method="POST" action="/api/mcp/authorize">'
    + '<h1>Connect Claude to Equavia</h1>'
    + '<p>Enter your app passcode to let Claude read and update your data.</p>'
    + (error ? '<div class="err">' + escapeHtml(error) + '</div>' : '')
    + '<input type="password" name="passcode" placeholder="Passcode" autofocus required autocomplete="off">'
    + '<input type="hidden" name="client_id" value="' + escapeHtml(clientId) + '">'
    + '<input type="hidden" name="redirect_uri" value="' + escapeHtml(redirectUri) + '">'
    + '<input type="hidden" name="state" value="' + escapeHtml(state) + '">'
    + '<input type="hidden" name="code_challenge" value="' + escapeHtml(codeChallenge) + '">'
    + '<input type="hidden" name="code_challenge_method" value="' + escapeHtml(codeChallengeMethod) + '">'
    + '<button type="submit">Allow</button>'
    + '</form></body></html>';
}

function handleMetadata(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const base = 'https://' + req.headers.host;
  return res.status(200).json({
    issuer: base,
    authorization_endpoint: base + '/api/mcp/authorize',
    token_endpoint: base + '/api/mcp/token',
    registration_endpoint: base + '/api/mcp/register',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  });
}

function handleAuthorize(req, res) {
  if (req.method === 'GET') {
    const q = req.query || {};
    if (!q.redirect_uri || !q.code_challenge) {
      return res.status(400).send('Missing required OAuth parameters (redirect_uri, code_challenge).');
    }
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(renderForm({
      clientId: q.client_id || '', redirectUri: q.redirect_uri, state: q.state || '',
      codeChallenge: q.code_challenge, codeChallengeMethod: q.code_challenge_method || 'S256',
    }));
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = Object.fromEntries(new URLSearchParams(body)); } catch { body = {}; } }
    body = body || {};
    const { passcode, client_id, redirect_uri, state, code_challenge, code_challenge_method } = body;
    if (!redirect_uri || !code_challenge) return res.status(400).send('Missing required OAuth parameters.');

    if (!verifyPasscode(passcode)) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(401).send(renderForm({
        clientId: client_id, redirectUri: redirect_uri, state, codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method, error: 'Incorrect passcode -- try again.',
      }));
    }

    const code = issueAuthorizationCode({ codeChallenge: code_challenge, redirectUri: redirect_uri, clientId: client_id || '' });
    if (!code) return res.status(500).send('Server not configured (missing SESSION_SECRET).');

    let url;
    try { url = new URL(redirect_uri); } catch { return res.status(400).send('Invalid redirect_uri.'); }
    url.searchParams.set('code', code);
    if (state) url.searchParams.set('state', state);
    return res.redirect(302, url.toString());
  }

  return res.status(405).send('method not allowed');
}

async function handleToken(req, res) {
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

function handleRegister(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const clientId = 'equavia-' + crypto.randomBytes(8).toString('hex');
  return res.status(201).json({
    client_id: clientId,
    client_name: body.client_name || 'MCP client',
    redirect_uris: Array.isArray(body.redirect_uris) ? body.redirect_uris : [],
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code'],
    response_types: ['code'],
  });
}

export default async function handler(req, res) {
  const action = resolveAction(req);
  if (action === 'metadata') return handleMetadata(req, res);
  if (action === 'authorize') return handleAuthorize(req, res);
  if (action === 'token') return handleToken(req, res);
  if (action === 'register') return handleRegister(req, res);
  return res.status(404).json({ error: 'not found' });
}
