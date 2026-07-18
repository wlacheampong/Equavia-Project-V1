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
  // is passed straight through to Anthropic's API. Content is normally a
  // string, but the calendar-event tool-use round trip needs to replay an
  // assistant tool_use block and send back a tool_result block, both of
  // which are content-block arrays rather than plain strings -- allowed
  // through as-is (Anthropic's API is the real validator of block shape),
  // just size-capped so a malformed client can't run up spend.
  const messages = [];
  for (const m of rawMessages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) {
      return res.status(400).json({ error: 'invalid message shape' });
    }
    if (typeof m.content === 'string') {
      if (!m.content.trim()) return res.status(400).json({ error: 'invalid message shape' });
      messages.push({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) });
    } else if (Array.isArray(m.content) && m.content.length) {
      if (JSON.stringify(m.content).length > MAX_MESSAGE_CHARS * 4) {
        return res.status(400).json({ error: 'message content too large' });
      }
      messages.push({ role: m.role, content: m.content });
    } else {
      return res.status(400).json({ error: 'invalid message shape' });
    }
  }
  const systemContext = typeof (body && body.systemContext) === 'string'
    ? body.systemContext.slice(0, MAX_CONTEXT_CHARS)
    : undefined;
  // Only the calendar-event proposal tool is ever sent, and only by
  // ask.html itself -- Anthropic's API is the real validator of schema
  // shape, so this just checks it's an array before passthrough.
  const tools = Array.isArray(body && body.tools) ? body.tools : undefined;

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
        tools,
      }),
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: 'Anthropic API error: ' + text.slice(0, 500) });
    let json;
    try { json = JSON.parse(text); } catch { return res.status(500).json({ error: 'non-JSON response from Anthropic' }); }
    const content = json.content || [];
    const replyText = content.filter((b) => b.type === 'text').map((b) => b.text).join('\n\n');
    const toolUseBlock = content.find((b) => b.type === 'tool_use') || null;
    return res.status(200).json({
      reply: replyText,
      toolUse: toolUseBlock ? { id: toolUseBlock.id, name: toolUseBlock.name, input: toolUseBlock.input } : null,
      rawContent: content,
      usage: json.usage || null,
    });
  } catch (e) {
    return res.status(500).json({ error: 'fetch error: ' + (e.message || String(e)) });
  }
}
