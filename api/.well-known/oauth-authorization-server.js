// OAuth 2.0 Authorization Server Metadata (RFC 8414), served at the domain
// root via vercel.json's rewrite -- Claude's MCP client discovers the
// authorize/token/register endpoints from here before ever showing the
// "connect" flow.
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  const base = 'https://' + req.headers.host;
  res.status(200).json({
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
