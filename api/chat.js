// Ask Claude page backend. The Anthropic API key lives only in this
// function's environment (ANTHROPIC_API_KEY on Vercel) -- never sent to
// or stored by the client. Model and max_tokens are fixed here, not
// client-controlled, so a compromised/buggy client can't drive up spend.
const ANTHROPIC_MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 1024;
const MAX_MESSAGE_CHARS = 8000;
const MAX_CONTEXT_CHARS = 6000;

// Best-effort only: a Vercel function instance is not guaranteed to stay
// warm or to be the only instance handling traffic, so this cannot be a
// real rate limit. For a single-user personal app it's enough to catch a
// runaway client bug or accidental rapid-fire sends, not real abuse.
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60000;
let rateLimitHits = [];
function withinRateLimit() {
  const now = Date.now();
  rateLimitHits = rateLimitHits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (rateLimitHits.length >= RATE_LIMIT_MAX) return false;
  rateLimitHits.push(now);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  if (!withinRateLimit()) {
    return res.status(429).json({ error: 'Too many messages in a short window — wait a moment and try again.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'server not configured (missing ANTHROPIC_API_KEY)' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const rawMessages = Array.isArray(body && body.messages) ? body.messages : null;
  if (!rawMessages || !rawMessages.length) return res.status(400).json({ error: 'messages required' });

  // Never forward anything that isn't a clean {role, content} pair -- this
  // is passed straight through to Anthropic's API.
  const messages = [];
  for (const m of rawMessages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim()) {
      return res.status(400).json({ error: 'invalid message shape' });
    }
    messages.push({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) });
  }
  const systemContext = typeof (body && body.systemContext) === 'string'
    ? body.systemContext.slice(0, MAX_CONTEXT_CHARS)
    : undefined;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemContext,
        messages,
      }),
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: 'Anthropic API error: ' + text.slice(0, 500) });
    let json;
    try { json = JSON.parse(text); } catch { return res.status(500).json({ error: 'non-JSON response from Anthropic' }); }
    const replyText = (json.content && json.content[0] && json.content[0].text) || '';
    return res.status(200).json({ reply: replyText, usage: json.usage || null });
  } catch (e) {
    return res.status(500).json({ error: 'fetch error: ' + (e.message || String(e)) });
  }
}
