// Ask Claude page backend. The Anthropic API key lives only in this
// function's environment (ANTHROPIC_API_KEY on Vercel) -- never sent to
// or stored by the client. Model and max_tokens are fixed here, not
// client-controlled, so a compromised/buggy client can't drive up spend.
//
// 6.0 security gate temporarily disabled (removed the requireSession call
// below) -- plan is to re-integrate later. lib/auth.js and the rest of the
// gate (lock.html, auth-gate.js, api/auth-login.js) are left in place, not
// deleted, so re-enabling is just restoring this import + the call site.
// import { requireSession } from '../lib/auth.js';

const ANTHROPIC_MODEL = 'claude-sonnet-5';
// Phase 4.2: Smart Capture parses free text into tool calls with Haiku
// (cheap, and the spec calls a full Sonnet round-trip overkill for a
// simple extraction task) -- an allowlist, not full client control, so the
// "model fixed server-side" protection above still holds: a client can
// pick between these two known-cost options, not name an arbitrary model.
const ALLOWED_MODELS = ['claude-sonnet-5', 'claude-haiku-4-5-20251001'];
// 4096, not the original 1024 -- the weekly audit (4.5) needed room for a
// single structured 6-section reply, and the annual review (6.10) is
// bigger again (trajectory + commitments + top 5s + themes across a whole
// year's worth of weekly audits).
const MAX_TOKENS = 4096;
const MAX_MESSAGE_CHARS = 8000;
// 20000, not the original 6000 -- the annual review's context is up to 52
// weeks of prior audit summaries, which a 6000-char cap would truncate
// mid-year. Still a hard ceiling against a runaway/buggy client, just sized
// for the biggest real context this app now assembles.
const MAX_CONTEXT_CHARS = 20000;

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Eq-Session');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  // if (!requireSession(req, res)) return; -- 6.0 gate temporarily disabled

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
  const model = ALLOWED_MODELS.includes(body && body.model) ? body.model : ANTHROPIC_MODEL;
  // Phase 4.5: the weekly audit needs Claude to reply with one specific
  // structured tool call (submit_audit) rather than free text, so its
  // sections can render as separate cards with real Implement/Ignore
  // buttons on the suggestions. Only honored alongside a matching tools
  // array -- Anthropic's API is the real validator either way.
  const toolChoice = (body && body.toolChoice && typeof body.toolChoice.name === 'string' && tools)
    ? { type: 'tool', name: body.toolChoice.name }
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
        model,
        max_tokens: MAX_TOKENS,
        system: systemContext,
        messages,
        tools,
        tool_choice: toolChoice,
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
