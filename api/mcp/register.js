// Dynamic Client Registration (RFC 7591) stub. Single-user app: there's no
// real client registry to maintain, and PKCE (not a client secret) is what
// actually secures /token -- this just satisfies MCP clients that expect a
// successful registration response before they'll proceed to /authorize.
import crypto from 'crypto';

export default async function handler(req, res) {
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
