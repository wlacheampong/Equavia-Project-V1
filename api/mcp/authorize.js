// OAuth authorize endpoint -- the "log in" step Claude's connector redirects
// the user's browser to. GET renders a passcode form (reusing the app's
// existing single shared passcode, lib/mcp-auth.js -> lib/auth.js); POST
// verifies it and redirects back to Claude with a short-lived authorization
// code carrying the PKCE code_challenge, so /token can later verify the
// matching code_verifier without any server-side session storage.
import { verifyPasscode, issueAuthorizationCode } from '../../lib/mcp-auth.js';

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

export default async function handler(req, res) {
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
