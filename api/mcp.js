// The actual MCP endpoint -- everything upstream (authorize.js, token.js,
// register.js, the well-known metadata) exists to get a valid Bearer token
// here. Requires one on every request; this is now an internet-reachable
// endpoint touching personal health/finance data, so that check has no
// exceptions.
//
// Stateless Streamable HTTP (sessionIdGenerator: undefined) -- fits
// Vercel's request/response serverless model, no long-lived connection or
// in-memory session state between requests.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { verifyAccessToken } from '../lib/mcp-auth.js';
import { TOOLS } from '../lib/mcp-tools.js';

// Best-effort only, same reasoning as api/chat.js's own rate limit: a
// Vercel function instance isn't guaranteed to stay warm or be the only
// instance handling traffic, so this just catches a runaway/misbehaving
// client, not real abuse.
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60000;
let rateLimitHits = [];
function withinRateLimit() {
  const now = Date.now();
  rateLimitHits = rateLimitHits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (rateLimitHits.length >= RATE_LIMIT_MAX) return false;
  rateLimitHits.push(now);
  return true;
}

function buildServer() {
  const server = new McpServer({ name: 'equavia', version: '1.0.0' });
  for (const t of TOOLS) {
    server.registerTool(t.name, { description: t.description, inputSchema: t.inputSchema }, t.handler);
  }
  return server;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.indexOf('Bearer ') === 0 ? authHeader.slice(7) : null;
  if (!verifyAccessToken(token)) {
    res.setHeader('WWW-Authenticate', 'Bearer resource_metadata="https://' + req.headers.host + '/.well-known/oauth-authorization-server"');
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (!withinRateLimit()) {
    return res.status(429).json({ error: 'Too many requests -- wait a moment and try again.' });
  }

  let parsedBody = req.body;
  if (typeof parsedBody === 'string') {
    try { parsedBody = JSON.parse(parsedBody); } catch { parsedBody = undefined; }
  }

  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: 'internal error: ' + (e.message || String(e)) });
  }
}
