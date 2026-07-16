export default async function handler(req, res) {
  const code = req.query && req.query.code;
  if (req.query && req.query.error) return res.status(400).send('Google auth error: ' + req.query.error);
  if (!code) return res.status(400).send('Missing code parameter.');
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri  = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).send('Server not configured (missing GOOGLE_* env vars).');
  }
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code', code, redirect_uri: redirectUri,
      client_id: clientId, client_secret: clientSecret,
    });
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const text = await tokenRes.text();
    if (!tokenRes.ok) return res.status(500).send('Google token exchange failed: ' + text);
    let json;
    try { json = JSON.parse(text); } catch { return res.status(500).send('Non-JSON: ' + text); }
    const access = json.access_token || '';
    const refresh = json.refresh_token || '';
    const expiresIn = json.expires_in || 3600;
    const hash = new URLSearchParams({
      gcal_access: access, gcal_refresh: refresh,
      gcal_expires: String(Date.now() + expiresIn * 1000),
    }).toString();
    res.writeHead(302, { Location: '/dashboard.html#' + hash });
    res.end();
  } catch (e) {
    res.status(500).send('Unexpected: ' + (e.message || String(e)));
  }
}
