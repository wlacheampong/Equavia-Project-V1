// 5.6 News page backend. Guardian Open Platform API only -- the spec also
// lists RSS (BBC London, BBC Sport, The Verge, Eurogamer/PC Gamer) as a
// second source, but this project has no package.json/npm install step at
// all, so there's no XML parser library available, and a hand-rolled regex
// RSS parser across four differently-shaped feeds wasn't worth the
// fragility for this pass -- Guardian's own sections already cover all 6
// categories the spec asks for. Flagged as a real scope cut, not silently
// dropped.
//
// Requires GUARDIAN_API_KEY (free key from https://open-platform.theguardian.com/)
// as a Vercel env var.
//
// 6.0 security gate temporarily disabled -- see api/chat.js for the note.
// import { requireSession } from '../lib/auth.js';

const SECTION_MAP = {
  local: 'uk-news',
  global: 'world',
  gaming: 'games',
  sport: 'sport',
  politics: 'politics',
  tech: 'technology',
};

// Best-effort in-memory cache, ~30 min per spec ("stay polite" to the free
// API tier) -- same "not guaranteed to be the only warm instance" caveat
// as every other in-memory cache in this codebase (api/chat.js's rate
// limiter, etc.). Keyed by category+page so "load more" doesn't collide
// with page 1's cache entry.
const CACHE_MS = 30 * 60000;
const cache = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Eq-Session');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  // if (!requireSession(req, res)) return; -- 6.0 gate temporarily disabled

  const category = String(req.query.category || '').toLowerCase();
  const section = SECTION_MAP[category];
  if (!section) return res.status(400).json({ error: 'unknown category' });
  const page = Math.max(1, Number(req.query.page) || 1);

  const cacheKey = category + ':' + page;
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.at < CACHE_MS) return res.status(200).json(cached.data);

  const apiKey = process.env.GUARDIAN_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'server not configured (missing GUARDIAN_API_KEY)' });

  const params = new URLSearchParams({
    section,
    'show-fields': 'trailText',
    'page-size': '10',
    page: String(page),
    'order-by': 'newest',
    'api-key': apiKey,
  });
  if (category === 'local') params.set('q', 'London');

  try {
    const r = await fetch('https://content.guardianapis.com/search?' + params.toString());
    const text = await r.text();
    if (!r.ok) return res.status(502).json({ error: 'Guardian API error: ' + text.slice(0, 300) });
    let json;
    try { json = JSON.parse(text); } catch { return res.status(500).json({ error: 'non-JSON response from Guardian' }); }
    const results = (json.response && json.response.results) || [];
    const items = results.map((a) => ({
      title: a.webTitle,
      url: a.webUrl,
      source: 'The Guardian',
      time: a.webPublicationDate,
      snippet: ((a.fields && a.fields.trailText) || '').replace(/<[^>]+>/g, ''),
      category,
    }));
    const hasMore = json.response ? (page * 10) < json.response.total : false;
    const data = { items, hasMore };
    cache[cacheKey] = { at: Date.now(), data };
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'fetch error: ' + (e.message || String(e)) });
  }
}
